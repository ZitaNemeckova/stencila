'use strict'

import Tool from 'substance/packages/tools/Tool'

/**
 * Tool for toggling the comment mode of a
 * Stencila Document `VisualEditor`
 *
 * @class      CommentTool (name)
 */
function CommentTool () {
  CommentTool.super.apply(this, arguments)
}

CommentTool.Prototype = function () {
  this.onClick = function () {
    this.send('comment-toggle')
  }
}

Tool.extend(CommentTool)

export default CommentTool

