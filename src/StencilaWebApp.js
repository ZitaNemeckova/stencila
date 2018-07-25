import { WebAppChrome } from 'substance-texture'
import StencilaAppMixin from './StencilaAppMixin'

export default class StencilaWebApp extends StencilaAppMixin(WebAppChrome) {
  _getDefaultDataFolder () {
    return './examples/'
  }
}
