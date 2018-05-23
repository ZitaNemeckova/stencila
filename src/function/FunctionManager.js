import { Configurator } from 'substance'
import FunctionPackage from './FunctionPackage'

/*
  Provides a Javascript API to create, update and lookup functions.

  Think of this as an in-memory function library. It does not parse or
  run functions, only the data is stored here for reflection.

  FunctionManager is used by the cell engine to lookup function calls, pick the
  right implementation and runs it.
*/
export default class FunctionManager {

  constructor(libraries = null) {
    // Maps function names to the library in which they have been defined
    this.functionMap = {}
    // Holds function instances scoped by libraryName and functionName
    this.functions = {}

    this.configurator = new Configurator().import(FunctionPackage)

    if (libraries) this.importLibraries(libraries)
  }

  /*
    Import a function
  */
  importFunction(context, func, libraryName = 'local') {
    const record = this.functionMap[func.name]
    if (record && record.library !== libraryName) {
      throw new Error(`Function "${func.name}" is already defined in library "${record.library}"`)
    }
    this.functionMap[func.name] = { context, library: libraryName }
    if (!this.functions[libraryName]) this.functions[libraryName] = {}
    this.functions[libraryName][func.name] = func
  }

  /*
    Import a function library
  */
  importLibrary(context, library) {
    for (let func of Object.values(library)) {
      this.importFunction(context, func, library.name)
    }
  }

  /**
   * Import a set of libraries
   *
   * @param  {object} libraries An object of libraries like `{name:xml}`
   */
  importLibraries(context, libraries) {
    for (let library of Object.values(libraries)) {
      this.importLibrary(context, library)
    }
  }

  getContextLibrary(functionName) {
    return this.functionMap[functionName]
  }

  /*
    Get function instance by name
  */
  getFunction(functionName) {
    let record = this.functionMap[functionName]
    if (record) {
      return this.functions[record.library][functionName]
    }
  }

  /*
    Get a list of available function names
  */
  getFunctionNames() {
    return Object.keys(this.functionMap)
  }
}
