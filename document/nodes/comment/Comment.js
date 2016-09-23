'use strict'

import Container from 'substance/model/Container'

function Comment () {
  Comment.super.apply(this, arguments)
}

Container.extend(Comment)

Comment.define({
  type: 'comment',
  who: { type: 'string', default: '' },
  when: { type: 'string', default: '' },
  nodes: { type: ['id'], default: [] }
})

export default Comment
