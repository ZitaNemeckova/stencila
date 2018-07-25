import { prettyPrintXML } from 'substance'
import { TextureArchive } from 'substance-texture'
import ArticleLoader from './article/ArticleLoader'
import SheetLoader from './sheet/SheetLoader'

// Note: this is overidden to
// 1. extend TextureArchive with the 'sheet' document type
// 2. add sanitization for name collisions
// 3. allow to pass down a customized context to the loaders
// -> 2. and 3. should be added to the general implementation
// -> 1. should be solved using configuration

export default class StencilaArchive extends TextureArchive {
  constructor (storage, buffer, context) {
    super(storage, buffer)

    this._context = context
  }

  load (archiveId) {
    return super.load(archiveId)
      // TODO: this should probably be done in Texture as well
      // so we should add this to general DAR sanitizations
      .then(() => {
        this._fixNameCollisions()
        return this
      })
  }

  // This is overridden because TextureArchive is lacking support
  // for providing a custom context to the loader
  // TODO: this should be possible in the general implementation
  _loadDocument (type, record, sessions) {
    let context = this._context
    let editorSession
    switch (type) {
      case 'article': {
        context = Object.assign({}, this._context, {
          pubMetaDb: sessions['pub-meta'].getDocument(),
          archive: this
        })
        editorSession = ArticleLoader.load(record.data, context)
        break
      }
      case 'sheet': {
        editorSession = SheetLoader.load(record.data, context)
        break
      }
      default:
        throw new Error('Unsupported document type')
    }
    let doc = editorSession.getDocument()
    doc.documentType = type
    return editorSession
  }

  // TODO: this should go into general implementation
  _fixNameCollisions () {
    let manifestSession = this._sessions['manifest']
    let entries = manifestSession.getDocument().getDocumentEntries()
    // TODO: this should also be done in DAR in general
    let names = new Set()
    entries.forEach(entry => {
      let name = entry.name
      // fixup the name as long there are collisions
      while (name && names.has(name)) {
        name = name + '(duplicate)'
      }
      if (entry.name !== name) {
        manifestSession.transaction(tx => {
          let docEntry = tx.get(entry.id)
          docEntry.attr({name})
        }, { action: 'renameDocument' })
      }
      names.add(entry.name)
    })
  }

  _exportDocument (type, session, sessions) {
    switch (type) {
      case 'sheet': {
        let dom = session.getDocument().toXML()
        let xmlStr = prettyPrintXML(dom)
        return xmlStr
      }
      default:
        return super._exportDocument(type, session, sessions)
    }
  }

  /*
    We use the name of the first document
    TODO: This is questionable. Because this is very implicit.
    This should be solved on DAR level, i.e. there should
    be a title on the DAR itself, whatever we do then to edit this.
  */
  getTitle () {
    let entries = this.getDocumentEntries()
    let firstEntry = entries[0]
    return firstEntry.name || firstEntry.id
  }

  // TODO: this should go into PersistedDocumentArchive
  // added `info.action = 'addDocument'`
  _addDocumentRecord (documentId, type, name, path) {
    this._sessions.manifest.transaction(tx => {
      let documents = tx.find('documents')
      let docEntry = tx.createElement('document', { id: documentId }).attr({
        name: name,
        path: path,
        type: type
      })
      documents.appendChild(docEntry)
    }, { action: 'addDocument' })
  }

  // TODO: this should go into PersistedDocumentArchive
  // added `info.action = 'renameDocument'`
  renameDocument (documentId, name) {
    this._sessions.manifest.transaction(tx => {
      let docEntry = tx.find(`#${documentId}`)
      docEntry.attr({name})
    }, { action: 'renameDocument' })
  }
}
