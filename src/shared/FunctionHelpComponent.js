import { Component } from 'substance'

export default class FunctionHelpComponent extends Component {
  render ($$) {
    let el = $$('div').addClass('sc-function-help')
    // FIXME: I have removed FunctionManager for now, until we understand
    // in which direction to go.
    const func = this.props.func

    if (func) {
      el.append(
        $$('div').addClass('se-name').append(func.name),
        $$('div').addClass('se-description').append(func.description)
      )
      // TODO: Currently only using the first method, allow for
      // multiple methods (ie. overloads with different parameter types)
      let method = Object.values(func.methods)[0]
      let params = method.params

      let syntaxEl = $$('div').addClass('se-syntax').append(
        $$('span').addClass('se-name').append(func.name),
        '('
      )
      if (params) {
        params.forEach((param, i) => {
          let paramEl = $$('span').addClass('se-signature-param').append(param.name)

          syntaxEl.append(paramEl)
          if (i < params.length - 1) {
            syntaxEl.append(',')
          }
        })
      }
      syntaxEl.append(')')

      el.append(
        $$('div').addClass('se-section-title').append('Signature'),
        syntaxEl
      )

      if (params) {
        params.forEach(param => {
          el.append(
            $$('div').addClass('se-param').append(
              $$('span').addClass('se-name').append(param.name),
              ' - ',
              $$('span').addClass('se-description').append(param.description)
            )
          )
        })
      }

      // Examples

      if (method.examples && method.examples.length > 0) {
        el.append(
          $$('div').addClass('se-section-title').append('Examples')
        )

        method.examples.forEach(example => {
          el.append(
            // $$('div').addClass('se-example-caption').append(example.caption),
            $$('pre').addClass('se-example-usage').append(example.usage)
          )
        })
      }

      el.append(
        $$('div').addClass('se-function-index').append(
          $$('a').attr({href: '#'}).append('← Function Index')
            .on('click', this._openFunctionHelp.bind(this, 'index'))
        )
      )
    } else {
      // FIXME removed FunctionManager
      const functionList = null

      if (functionList) {
        const functionListEl = functionList.map(func => $$('div').addClass('se-item').append(
          $$('a').attr({href: '#'})
            .append(func)
            .on('click', this._openFunctionHelp.bind(this, func))
        ))
        let functionsSection = $$('div').addClass('se-functions').append(
          $$('div').addClass('se-title').append('Functions'),
          $$('div').addClass('se-subtitle').append('Use these built-in functions'),
          $$('div').addClass('se-functions-list').append(functionListEl)
        )

        el.append(
          // tutorialsSection,
          functionsSection
        )
      }
    }
    return el
  }

  _openFunctionHelp (funcName) {
    this.send('openHelp', `function/${funcName}`)
  }
}
