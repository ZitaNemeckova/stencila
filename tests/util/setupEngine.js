import { setupHost, Engine, MiniContext, JsContext } from 'stencila-engine'
import { libtest } from '../contexts/libtest'

export default async function setupEngine () {
  let host = await setupHost({
    contexts: [
      { lang: 'mini', client: MiniContext },
      { lang: 'js', client: JsContext }
    ],
    libraries: [{
      lang: 'js',
      lib: libtest
    }]
  })
  let engine = new Engine({ host })
  let graph = engine._graph
  return { engine, host, graph }
}
