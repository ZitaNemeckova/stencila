import { Component } from 'substance'
import ProjectTab from './ProjectTab'
import AddProjectTab from './AddProjectTab'
import ContextToggle from './ContextToggle'

export default class ProjectBar extends Component {
  render ($$) {
    const archive = this.props.archive
    const documentEntries = archive.getDocumentEntries()
    let contextId = this.props.contextId

    let el = $$('div').addClass('sc-project-bar')
    let projectTabs = $$('div').addClass('se-project-tabs')

    documentEntries.forEach(entry => {
      if (_isVisible(entry)) {
        projectTabs.append(
          $$(ProjectTab, {
            entry,
            active: this.props.documentId === entry.id
          })
        )
      }
    })

    projectTabs.append(
      $$(AddProjectTab)
    )

    let contextToggles = $$('div').addClass('se-context-toggles')

    contextToggles.append(
      $$(ContextToggle, {
        action: 'toggleHelp',
        icon: 'fa-question-circle',
        active: contextId === 'help'
      })
    )

    el.append(
      projectTabs,
      contextToggles
    )

    return el
  }
}

// TODO: this needs to be done in a different way
// we should still show tabs, but render them in a raw way (without editing)
const supportedDocumentTypes = {
  'article': 'Article',
  'sheet': 'Sheet'
}

function _isVisible (entry) {
  return Boolean(supportedDocumentTypes[entry.type])
}
