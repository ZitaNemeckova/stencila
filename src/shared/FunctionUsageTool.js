import { ToggleTool } from 'substance'
import FunctionUsageComponent from '../shared/FunctionUsageComponent'

export default class FunctionUsageTool extends ToggleTool {
  render ($$) {
    let el = $$('div').addClass('sc-function-usage-tool')
    // let functionName = this.props.commandState.functionName
    // FIXME: removed FunctionManager
    let func
    if (func) {
      el.append(
        $$(FunctionUsageComponent, {
          spec: func,
          paramIndex: this.props.commandState.paramIndex
        })
      )
    }
    return el
  }
}
