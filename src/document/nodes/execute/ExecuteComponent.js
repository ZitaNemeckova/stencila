import Component from 'substance/ui/Component'
import CodeEditorComponent from '../../ui/CodeEditorComponent'

class ExecuteComponent extends Component {

  render ($$) {
    let node = this.props.node
    let el = super.render.call(this, $$)
      .addClass('sc-execute')
      .addClass(node.show ? 'sm-show' : '')
      .append(
        $$('div')
          .append(
            $$('input')
              .attr({
                value: node.session,
                placeholder: 'Execution language',
                spellcheck: 'false'
              })
              .on('change', event => {
                this.context.editorSession.transaction(function (tx, args) {
                  tx.set([node.id, 'session'], event.target.value)
                })
              }),
            $$('input')
              .attr({
                value: node.input,
                placeholder: 'Input',
                spellcheck: 'false'
              })
              .on('change', event => {
                this.context.editorSession.transaction(function (tx, args) {
                  tx.set([node.id, 'input'], event.target.value)
                })
              }),
            $$('input')
              .attr({
                value: node.output,
                placeholder: 'Output',
                spellcheck: 'false'
              })
              .on('change', event => {
                this.context.editorSession.transaction(function (tx, args) {
                  tx.set([node.id, 'output'], event.target.value)
                })
              }),
            $$('button')
              .text('refresh')
              .on('click', event => {
                node.refresh()
              }),
            $$('span')
              .text(node.duration.toString())
          ),

        $$(ExecuteCodeEditorComponent, {
          node: node,
          codeProperty: 'code',
          languageProperty: 'session'
        }).ref('editor')
      )

    var errors = node.result.errors
    if (errors) {
      let session = this.refs.editor.editor.getSession()
      let annotations = Object.keys(errors).map((row, index) => {
        return {
          row: row,
          column: 0,
          text: errors[row],
          type: 'error'
        }
      })
      session.setAnnotations(annotations)
    }

    var output = node.result.output
    if (output) {
      let format = output.format
      let value = output.value
      let outputEl
      if (format === 'png') {
        outputEl = $$('img').attr({
          src: value
        })
      } else if (format === 'csv') {
        let table = ''
        value.split('\n').forEach(function (row) {
          table += '<tr>'
          row.split(',').forEach(function (cell) {
            table += '<td>' + cell + '</td>'
          })
          table += '</tr>'
        })
        outputEl = $$('table').html(table)
      } else {
        outputEl = $$('pre').text(value || '')
      }
      el.append(outputEl)
    }

    return el
  }

  didMount () {
    let node = this.props.node
    node.on('changed', () => {
      this.rerender()
    })
  }

}

/**
 * A code editor component which refreshes the node when the editor
 * looses focus. This is a temporary hack. Ideally, we want a refresh to occur
 * when the `node.code` changes, not when the editor looses focus.
 */
class ExecuteCodeEditorComponent extends CodeEditorComponent {
  _onEditorBlur () {
    super._onEditorBlur()
    this.props.node.refresh()
  }
}

export default ExecuteComponent
