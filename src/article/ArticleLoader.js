import { EditorSession } from 'substance'
import { JATSImporter, TextureConfigurator } from 'substance-texture'
import ArticleEditorPackage from './ArticleEditorPackage'

export default {
  load(xml, context) {
    let configurator = new TextureConfigurator()
    configurator.import(ArticleEditorPackage)
    let jatsImporter = new JATSImporter()
    let jats = jatsImporter.import(xml, context)
    let importer = configurator.createImporter('texture-jats')
    let doc = importer.importDocument(jats.dom)
    let editorSession = new EditorSession(doc, { configurator })
    return editorSession
  }
}
