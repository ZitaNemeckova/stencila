import { parse } from 'acorn'
import { ancestor as ancestorWalk } from 'acorn/dist/walk'
import { generate as generateCode } from 'astring/src/astring'
import { isFunction, isNil, last } from 'substance'

import Context from './Context'
import libcore from 'stencila-libcore'

const SEMICOLON = ';'.charCodeAt(0)

/**
 * A Javascript context
 *
 * Implements the Stencila `Context` API. All methods return a Promise.
 *
 * @extends Context
 */
export default class JsContext extends Context {

  constructor () {
    super()

    // Global variable names that should be ignored when determining code input during `analyseCode()`
    this._globals = [
      // A list of ES6 globals obtained using:
      // ```
      // const globals = require('globals')
      // JSON.stringify(Object.keys(globals.es6))
      // ```
      "Array","ArrayBuffer","Boolean","constructor","DataView","Date","decodeURI","decodeURIComponent",
      "encodeURI","encodeURIComponent","Error","escape","eval","EvalError","Float32Array","Float64Array",
      "Function","hasOwnProperty","Infinity","Int16Array","Int32Array","Int8Array","isFinite","isNaN",
      "isPrototypeOf","JSON","Map","Math","NaN","Number","Object","parseFloat","parseInt","Promise",
      "propertyIsEnumerable","Proxy","RangeError","ReferenceError","Reflect","RegExp","Set","String",
      "Symbol","SyntaxError","System","toLocaleString","toString","TypeError","Uint16Array","Uint32Array",
      "Uint8Array","Uint8ClampedArray","undefined","unescape","URIError","valueOf","WeakMap","WeakSet"
    ]

    this._libs = {
      core: libcore
    }
  }

  /**
   * Get the list of supported programming languages
   *
   * @override
   */
  supportedLanguages () {
    return Promise.resolve(
      ['js']
    )
  }

  /**
   * Analyse code and return the names of inputs, output and
   * implicitly returned value expression
   *
   * @override
   */
  _analyseCode (code, exprOnly = false) {
    let inputs = []
    let output = null
    let messages = []
    let valueExpr

    // Parse the code
    let ast
    try {
      ast = parse(code)
    } catch (error) {
      messages.push(this._packError(error))
    }
    // simple expressions (such as in Sheet cells)
    if (messages.length === 0 && exprOnly) {
      if (!_isSimpleExpression(ast)) {
        messages.push(this._packError(new Error ('Code is not a single, simple expression')))
      }
    }
    // dependency analysis
    if (messages.length === 0) {
      // Note: assumingFthat all variables used as globals are inputs
      let deps = findGlobals()
      inputs = deps.map(g => g.name)
    }
    // output value extraction
    if (messages.length === 0) {
      ([output, valueExpr] = _extractOutput(ast))
    }
    let result = {
      inputs,
      output,
      messages,
      valueExpr
    }
    return Promise.resolve(result)
  }

  /**
   * Execute JavaScript code
   *
   * @override
   */
  _executeCode (code = '', inputs = {}, exprOnly = false) {
    return this._analyseCode(code, exprOnly, true).then(codeAnalysis => {
      let inputNames = codeAnalysis.inputs
      let outputName = codeAnalysis.output
      let valueExpr = codeAnalysis.valueExpr
      let value
      let messages = codeAnalysis.messages
      let stdout = ''
      let stderr = ''

      let errors = messages.filter(message => message.type === 'error').length
      if (errors === 0) {
        // Extract the names and values of inputs to be used as arguments
        // (some inputs may be global and so their value in accessed directly from the function)
        let argNames = []
        let argValues = []
        inputNames.forEach(name => {
          let value = inputs[name]
          if (typeof value === 'undefined') {
            messages.push({
              line: 0,
              column: 0,
              type: 'warn',
              message: `Input variable "${name}" is not managed`
            })
          }
          else {
            argNames.push(name)
            argValues.push(this._unpackValue(value))
          }
        })

        // Capture console output functions
        let captureConsole = {
          log: function (txt) { stdout += txt },
          info: function (txt) { stdout += txt },
          warn: function (txt) { stdout += txt },
          error: function (txt) { stderr += txt }
        }
        let nullConsole = {
          log: function () {},
          info: function () {},
          warn: function () {},
          error: function () {}
        }

        // Add the return value of function to the code
        // (i.e. simulate implicit return)
        // To prevent duplication of console output
        if (valueExpr) code += `;\nconsole=nullConsole;return ${valueExpr};`

        // Execute the function with the unpacked inputs.
        try {
          const func = new Function(...argNames, 'console', 'nullConsole', code) // eslint-disable-line no-new-func
          value = func(...argValues, captureConsole, nullConsole)
        } catch (error) {
          messages.push(this._packError(error))
        }
      }

      let streams = null
      if (stdout.length || stderr.length) {
        streams = {
          stdout: stdout,
          stderr: stderr
        }
      }

      return {
        inputs: inputNames,
        output: outputName,
        value: this._packValue(value),
        messages: messages,
        streams: streams
      }
    })
  }

  libraries() {
    return Promise.resolve(this._libs)
  }

  importLibrary(library) {
    this._libs[library.name] = library
  }

  /**
   * Does the context provide a function?
   *
   * @override
   */
  hasFunction (libName, functionName) {
    let has = false
    const lib = this._libs[libName]
    if (lib) {
      if (lib[functionName]) has = true
    }
    return Promise.resolve(has)
  }

  /**
   * Call a function
   *
   * @override
   */
  callFunction (libName, functionName, args = []) {
    if (!functionName) throw new Error("'name' is mandatory")

    const lib = this._libs[libName]
    if (!lib) throw new Error('No library registered with name: ' + libName)

    let func = lib.funcs[functionName]
    if (!func) throw new Error('No function with name: ' + functionName)

    let funcBody = func.body
    if (!isFunction(funcBody)) throw new Error(`Registered function with name ${functionName} is invalid!`)

    let values = args.map(arg => this._unpackValue(arg))

    let messages = []
    let value
    try {
      value = funcBody(...values)
    } catch (error) {
      messages.push(this._packError(error))
    }

    return Promise.resolve({
      messages: messages,
      value: this._packValue(value)
    })
  }

  /**
   * Unpack a value passed from the `Engine` or another `Context`
   */
  _unpackValue(packed) {
    return packed ? packed.data : null
  }

  /**
   * Pack a value for passing to `Engine` or another `Context`
   */
  _packValue (value) {
    if (isNil(value)) return null
    let type
    if (Number.isInteger(value)) type = 'integer'
    else type = value.type || typeof value
    return {
      type: type,
      data: value
    }
  }

  /**
   * Pack an error into a {line, column, type, message} record
   *
   * @param {Error} error - Error object
   * @return {Object} - Error record
   */
  _packError (error) {
    let line = 0
    let column = 0
    let message

    if (error instanceof SyntaxError && error.loc) {
      // Get message, line and columns numbers
      line = error.loc.line
      column = error.loc.column
      message = 'SyntaxError: ' + error.message
    } else if (error.stack) {
      // Parse the error stack to get message, line and columns numbers
      let lines = error.stack.split('\n')
      let match = lines[1].match(/<anonymous>:(\d+):(\d+)/)
      if (match) {
        line = parseInt(match[1], 10) - 2
        column = parseInt(match[2], 10)
      }
      message = lines[0] || error.message
    } else {
      message = error.message
    }

    return {
      line: line,
      column: column,
      type: 'error',
      message: message
    }
  }
}


// helpers

function _isSimpleExpression(ast) {
  if (ast.body.length === 0) return true
  if (ast.body.length > 1) return false
  let node = ast.body[0]
  if (node.type === 'ExpressionStatement') {
    // Only allow simple expressions
    // See http://esprima.readthedocs.io/en/latest/syntax-tree-format.html#expressions-and-patterns
    // for a list of expression types
    let dissallowed = ['AssignmentExpression', 'UpdateExpression', 'AwaitExpression', 'Super']
    return (dissallowed.indexOf(node.expression.type) < 0)
  }
  // otherwise
  return false
}

function _extractOutput(ast) {
  // If the last top level node in the AST is a VariableDeclaration or Identifier then use
  // the variable name as the output name
  let node = last(ast.body)
  let output, valueExpr
  if (node) {
    if (node.type === 'VariableDeclaration') {
      output = node.declarations[0].id.name
      valueExpr = output
    } else if (node.type === 'ExpressionStatement') {
      if(node.expression.type === 'Identifier') {
        output = node.expression.name
      }
      valueExpr = generateCode(node)
      if (valueExpr.charCodeAt(valueExpr.length-1) === SEMICOLON) {
        valueExpr = valueExpr.slice(0, -1)
      }
    }
  }
  return [output, valueExpr]
}

function findGlobals(source, options) {
  options = options || {}
  let globals = []
  let ast
  // istanbul ignore else
  if (typeof source === 'string') {
    ast = _parse(source, options);
  } else {
    ast = source;
  }
  if (!(ast && typeof ast === 'object' && ast.type === 'Program')) {
    throw new TypeError('Source must be either a string of JavaScript or an acorn AST');
  }
  ancestorWalk(ast, {
    'VariableDeclaration': function (node, parents) {
      let parent = null;
      for (let i = parents.length - 1; i >= 0 && parent === null; i--) {
        if (node.kind === 'var' ? _isScope(parents[i]) : _isBlockScope(parents[i])) {
          parent = parents[i];
        }
      }
      parent.locals = parent.locals || {};
      node.declarations.forEach(function (declaration) {
        _declarePattern(declaration.id, parent);
      });
    },
    'FunctionDeclaration': function (node, parents) {
      let parent = null;
      for (let i = parents.length - 2; i >= 0 && parent === null; i--) {
        if (_isScope(parents[i])) {
          parent = parents[i];
        }
      }
      parent.locals = parent.locals || {};
      parent.locals[node.id.name] = true;
      _declareFunction(node);
    },
    'Function': _declareFunction,
    'ClassDeclaration': function (node, parents) {
      let parent = null;
      for (let i = parents.length - 2; i >= 0 && parent === null; i--) {
        if (_isScope(parents[i])) {
          parent = parents[i];
        }
      }
      parent.locals = parent.locals || {};
      parent.locals[node.id.name] = true;
    },
    'TryStatement': function (node) {
      if (node.handler === null) return;
      node.handler.locals = node.handler.locals || {};
      node.handler.locals[node.handler.param.name] = true;
    },
    'ImportDefaultSpecifier': _declareModuleSpecifier,
    'ImportSpecifier': _declareModuleSpecifier,
    'ImportNamespaceSpecifier': _declareModuleSpecifier
  })

  function _identifier(node, parents) {
    var name = node.name;
    if (name === 'undefined') return;
    for (var i = 0; i < parents.length; i++) {
      if (name === 'arguments' && _declaresArguments(parents[i])) {
        return;
      }
      if (parents[i].locals && name in parents[i].locals) {
        return;
      }
    }
    node.parents = parents;
    globals.push(node);
  }
  ancestorWalk(ast, {
    'VariablePattern': _identifier,
    'Identifier': _identifier,
    'ThisExpression': function (node, parents) {
      for (var i = 0; i < parents.length; i++) {
        if (_declaresThis(parents[i])) {
          return;
        }
      }
      node.parents = parents
      globals.push(node)
    }
  })
  let groupedGlobals = {}
  globals.forEach(function (node) {
    var name = node.type === 'ThisExpression' ? 'this' : node.name;
    groupedGlobals[name] = (groupedGlobals[name] || []);
    groupedGlobals[name].push(node);
  });
  return Object.keys(groupedGlobals).sort().map(function (name) {
    return {
      name,
      nodes: groupedGlobals[name]
    }
  })
}


function _isScope(node) {
  return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression' || node.type === 'Program';
}

function _isBlockScope(node) {
  return node.type === 'BlockStatement' || _isScope(node);
}

function _declaresArguments(node) {
  return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
}

function _declaresThis(node) {
  return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
}
function _parse(source, options) {
  let parseOptions = Object.assign({}, options,
    {
      allowReturnOutsideFunction: true,
      allowImportExportEverywhere: true,
      allowHashBang: true
    }
  )
  return parse(source, parseOptions)
}

function _declareFunction(node) {
  let fn = node;
  fn.locals = fn.locals || {};
  node.params.forEach(function (node) {
    _declarePattern(node, fn);
  });
  if (node.id) {
    fn.locals[node.id.name] = true;
  }
}

function _declarePattern(node, parent) {
  switch (node.type) {
    case 'Identifier':
      parent.locals[node.name] = true;
      break;
    case 'ObjectPattern':
      node.properties.forEach(function (node) {
        _declarePattern(node.value, parent);
      });
      break;
    case 'ArrayPattern':
      node.elements.forEach(function (node) {
        if (node) _declarePattern(node, parent);
      });
      break;
    case 'RestElement':
      _declarePattern(node.argument, parent);
      break;
    case 'AssignmentPattern':
      _declarePattern(node.left, parent);
      break;
    // istanbul ignore next
    default:
      throw new Error('Unrecognized pattern type: ' + node.type);
  }
}

function _declareModuleSpecifier(ast, node) {
  ast.locals = ast.locals || {};
  ast.locals[node.local.name] = true;
}
