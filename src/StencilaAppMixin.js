import { forEach } from 'substance'
import { JATSImportDialog } from 'substance-texture'
import Project from './project/Project'
import SheetAdapter from './sheet/SheetAdapter'
import ArticleAdapter from './article/ArticleAdapter'
import setupStencilaContext from './setupStencilaContext'
import StencilaArchive from './StencilaArchive'

// This is applied to DesktopAppChrome and WebAppChrome
export default function StencilaAppMixin (ParentAppChrome) {
  return class StencilaApp extends ParentAppChrome {
    render ($$) {
      let el = $$('div').addClass('sc-app')
      let { archive, error } = this.state
      if (archive) {
        el.append(
          $$(Project, {
            documentArchive: archive
          })
        )
      } else if (error) {
        if (error.type === 'jats-import-error') {
          el.append(
            $$(JATSImportDialog, { errors: error.detail })
          )
        } else {
          el.append(
            'ERROR:',
            error.message
          )
        }
      } else {
        // LOADING...
      }
      return el
    }

    _setupChildContext () {
      return setupStencilaContext()
    }

    _getArchiveClass () {
      return StencilaArchive
    }

    async _initArchive (archive, context) {
      const engine = context.engine
      if (engine) {
        // when a document is renamed, transclusions must be updated
        _listenForDocumentRecordUpdates(archive, engine)
        // documents and sheets must be registered with the engine
        // and hooks for structural sheet updates must be established
        // to update transclusions.
        let entries = archive.getDocumentEntries()
        forEach(entries, entry => {
          _connectDocumentToEngine(engine, archive, entry.id)
        })
      }
      return archive
    }

    willUpdateState (newState) {
      if (newState.archive) {
        const engine = this._childContext.engine
        engine.runForEver(10)
      }
    }

  }
}

// TODO: try to add these to the App prototype

function _listenForDocumentRecordUpdates (archive, engine) {
  let editorSession = archive.getEditorSession('manifest')
  editorSession.on('update', _onManifestChange.bind(null, archive, engine), null, { resource: 'document' })
}

function _onManifestChange (archive, engine, change) {
  let action = change.info.action
  switch (action) {
    case 'renameDocument': {
      // extracting document id, old name and the new name
      // TODO: maybe we can create an API to access such documentChange informations
      let op = change.ops[0]
      let docId = op.path[0]
      let oldName = op.original
      let newName = op.val
      if (oldName !== newName) {
        // TODO: it would be nice, if this could be done by the respective
        // document/sheet adapter. However, ATM renaming is done on manifest only,
        // so there is no document level notion of the name.
        let resource = engine.getResource(docId)
        resource.rename(newName)
      }
      break
    }
    case 'addDocument': {
      let op = change.ops[0]
      let docId = op.path[0]
      _connectDocumentToEngine(engine, archive, docId)
      break
    }
    default:
      //
  }
}

// Connects documents with the Cell Engine
// and registers hooks to update transclusions.
function _connectDocumentToEngine (engine, archive, documentId) {
  let manifest = archive.getEditorSession('manifest').getDocument()
  let docEntry = manifest.get(documentId)
  let editorSession = archive.getEditorSession(documentId)
  let docType = docEntry.attr('type')
  let name = docEntry.attr('name')
  let docId = docEntry.id
  let Adapter
  switch (docType) {
    case 'article': {
      Adapter = ArticleAdapter
      break
    }
    case 'sheet': {
      Adapter = SheetAdapter
      break
    }
    default:
      //
  }
  if (Adapter) {
    Adapter.connect(engine, editorSession, docId, name)
  }
}
