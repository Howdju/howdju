import React, {Component} from 'react'
import PropTypes from 'prop-types'
import map from 'lodash/map'

import StatementCompoundViewerAtomItem from './StatementCompoundViewerAtomItem'

import './StatementCompoundViewer.scss'

export default class StatementCompoundViewer extends Component {

  render() {
    const {
      id,
      statementCompound,
      doShowControls,
      doShowStatementAtomJustifications,
      isCondensed,
      isUnCondensed,
      showBasisUrls,
      ...rest
    } = this.props

    const idPrefix = id ? id + '-' : ''

    const atomListItems = map(statementCompound.atoms, atom => {
      const listItemId = `${idPrefix}statement-compound-${atom.compoundId}-statement-atom-${atom.entity.id}-list-item`
      return (
        <StatementCompoundViewerAtomItem
          id={listItemId}
          key={listItemId}
          atom={atom}
          component="li"
          doShowControls={doShowControls}
          doShowJustifications={doShowStatementAtomJustifications}
          isCondensed={isCondensed}
          isUnCondensed={isUnCondensed}
          showBasisUrls={showBasisUrls}

          doShowStatementAtomJustifications={doShowStatementAtomJustifications}
        />
      )
    })

    return (
      <ol
        {...rest}
        className="compound-viewer statement-compound-viewer"
      >
        {atomListItems}
      </ol>
    )
  }
}
StatementCompoundViewer.propTypes = {
  /** Required for the CircularProgress */
  id: PropTypes.string.isRequired,
  statementCompound: PropTypes.object.isRequired,
  /** Identifies the editor's state */
  editorId: PropTypes.string,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  doShowControls: PropTypes.bool,
  doShowAtomJustifications: PropTypes.bool,
  isCondensed: PropTypes.bool,
  isUnCondensed: PropTypes.bool,
}
