import { Engine, MiniContext, setupContext } from 'stencila-engine'
import { JavascriptContext } from 'stencila-js'
import libcore from 'stencila-libcore'
export default async function setupStencilaContext () {
  // Note: I have removed all Host for now
  // I am in favor of moving these things into stencila-node
  // and add a light-weight HostClient for configuration

  let context = await setupContext({
    contexts: [
      { id: 'mickey', lang: 'mini', client: MiniContext },
      { id: 'goofy', lang: 'js', client: JavascriptContext }
    ],
    libraries: [
      { lang: 'js', lib: libcore }
    ]
  })
  let engine = new Engine(context)

  // EXPERIMENTAL: register all library content as globals
  // TODO: this needs to be done automatically
  // as an initialization step
  let jsContext = context.getLanguageContext('js')
  let names = Object.keys(libcore.funcs)
  names.forEach(name => {
    // TODO: do we want that extra level here?
    // need to discuss if the function type could
    // be simplified
    engine._addGlobal(name, {
      type: 'function',
      value: {
        type: 'function',
        data: {
          name,
          library: libcore.name,
          context: jsContext.id
        }
      }
    })
  })

  return { engine }
}
