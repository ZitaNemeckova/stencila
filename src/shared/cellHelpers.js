import { TextureDocument } from 'substance-texture'
import { engineHelpers } from 'stencila-engine'

export function getCellState(cell) {
  // FIXME: we should make sure that cellState is
  // initialized as early as possible
  return cell.state
}

export function getCellValue(cell) {
  if (!cell) return undefined
  if (cell.state) {
    return cell.state.value
  } else {
    let preferredType = getCellType(cell)
    return engineHelpers.valueFromText(cell.text(), preferredType)
  }
}

export function getCellType(cell) {
  let type = cell.attr('type')
  if (!type) {
    let doc = cell.getDocument()
    let docType = doc.documentType
    if (docType === 'sheet') {
      let row = cell.parentNode
      let colIdx = row._childNodes.indexOf(cell.id)
      let columnMeta = doc.getColumnMeta(colIdx)
      type = columnMeta.attr('type')
    }
  }
  return type || 'any'
}

export function _getSourceElement(cellNode) {
  if (cellNode.getDocument() instanceof TextureDocument) {
    // ATTENTION: this caching would be problematic if the cell element
    // was changed structurally, e.g. the <source-code> element replaced.
    // But we do not do this, so this should be fine.
    if (!cellNode._sourceEl) {
      cellNode._sourceEl = cellNode.find('source-code')
    }
    return cellNode._sourceEl
  }
  return cellNode
}

export function getSource(cellNode) {
  return _getSourceElement(cellNode).textContent
}

export function setSource(cellNode, newSource) {
  let el = _getSourceElement(cellNode)
  el.text(newSource)
}

export function getLang(cellNode) {
  return _getSourceElement(cellNode).getAttribute('language')
}

export function getError(cell) {
  let cellState = getCellState(cell)
  if (cellState && cellState.errors) {
    return cellState.errors[0]
  }
}

export function getErrorMessage(error) {
  switch(error.name) {
    case 'unresolved': {
      return 'Unresolved inputs: ' + error.details.unresolved.map(s => {
        return s.origStr || s.name
      }).join(', ')
    }
    case 'cyclic': {
      let frags = []
      let trace = error.details.trace
      let symbols = error.details.symbols
      trace.forEach(id => {
        let s = symbols[id]
        if (s) {
          frags.push(s.origStr || s)
        }
      })
      frags.push(frags[0])
      return 'Cyclic Dependency: ' + frags.join(' -> ')
    }
    case 'syntax': {
      return 'Syntax Error'
    }
    default:
      return error.message
  }
}

export function getValue(cell) {
  let cellState = getCellState(cell)
  if (cellState) {
    return cellState.value
  }
}

export function getFrameSize(layout) {
  // WORKAROUND, this should be solved in libcore functions
  const defaultSizes = {
    'width': '400',
    'height': '400'
  }
  const sizes = layout.width ? layout : defaultSizes
  return sizes
}
