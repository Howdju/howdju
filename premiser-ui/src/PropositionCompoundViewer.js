import React, {Component} from 'react'
import PropTypes from 'prop-types'
import map from 'lodash/map'

import PropositionCompoundViewerAtomItem from './PropositionCompoundViewerAtomItem'
import {
  combineIds,
} from './viewModels'

import './PropositionCompoundViewer.scss'

export default class PropositionCompoundViewer extends Component {

  render() {
    const {
      id,
      propositionCompound,
      doShowControls,
      doShowPropositionAtomJustifications,
      isCondensed,
      isUnCondensed,
      showBasisUrls,
      showStatusText,
      contextTrailItems,
      ...rest
    } = this.props

    const atomListItems = map(propositionCompound.atoms, atom => {
      const listItemId = combineIds(id, `proposition-atom-${atom.entity.id}`, 'list-item')
      return (
        <PropositionCompoundViewerAtomItem
          id={listItemId}
          key={listItemId}
          atom={atom}
          component="li"
          doShowControls={doShowControls}
          doShowJustifications={doShowPropositionAtomJustifications}
          isCondensed={isCondensed}
          isUnCondensed={isUnCondensed}
          showBasisUrls={showBasisUrls}
          showStatusText={showStatusText}
          doShowPropositionAtomJustifications={doShowPropositionAtomJustifications}
          contextTrailItems={contextTrailItems}
        />
      )
    })

    return (
      <ol
        {...rest}
        className="compound-viewer proposition-compound-viewer"
      >
        {atomListItems}
      </ol>
    )
  }
}
PropositionCompoundViewer.propTypes = {
  /** Required for the CircularProgress */
  id: PropTypes.string.isRequired,
  propositionCompound: PropTypes.object.isRequired,
  /** Identifies the editor's state */
  editorId: PropTypes.string,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  doShowControls: PropTypes.bool,
  doShowAtomJustifications: PropTypes.bool,
  isCondensed: PropTypes.bool,
  showStatusText: PropTypes.bool,
  isUnCondensed: PropTypes.bool,
}
