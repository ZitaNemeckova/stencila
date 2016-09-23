'use strict'

import Component from 'substance/ui/Component'

import CodeEditorComponent from '../../ui/CodeEditorComponent'
import sanitize from './sanitize'

function DefaultComponent () {
  DefaultComponent.super.apply(this, arguments)
}

DefaultComponent.Prototype = function () {
  var _super = DefaultComponent.super.prototype

  this.getInitialState = function () {
    return {
      edit: false
    }
  }

  this.render = function ($$) {
    var node = this.props.node
    var el = _super.render.call(this, $$)
      .addClass('sc-default')
    if (this.state.edit) {
      var code = $$(CodeEditorComponent, {
        node: node,
        codeProperty: 'html',
        languageProperty: null,
        language: 'html'
      }).ref('code')
      el.append(code)
    }
    return el.append(
      $$('div')
        .ref('display')
        .addClass('se-display')
        .attr('contenteditable', false)
        .html(sanitize(node.html))
    )
  }

  this.didMount = function () {
    this.props.node.on('html:changed', this.rerender, this)
    this.props.node.on('edit:toggle', this._onEditToggle, this)
  }

  this._onEditToggle = function () {
    this.extendState({
      edit: !this.state.edit
    })
  }
}

Component.extend(DefaultComponent)

DefaultComponent.fullWidth = true

export default DefaultComponent
