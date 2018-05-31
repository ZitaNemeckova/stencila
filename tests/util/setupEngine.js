import { setupContext, Engine, MiniContext, JsContext } from 'stencila-engine'
import { libtest } from '../libtest'

export default async function setupEngine () {
  let context = await setupContext({
    contexts: [
      { lang: 'mini', client: MiniContext },
      { lang: 'js', client: JsContext }
    ],
    libraries: [{
      lang: 'js',
      lib: libtest
    }]
  })
  let engine = new Engine(context)
  let graph = engine._graph
  return { engine, context, graph }
}
