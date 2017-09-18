import React, {Component} from 'react'
import map from 'lodash/map'

import StatementCompoundViewerAtomListItem from './StatementCompoundViewerAtomListItem'

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
    } = this.props

    const idPrefix = id ? id + '-' : ''

    const atomListItems = map(statementCompound.atoms, atom => {
      const listItemId = `${idPrefix}statement-compound-${atom.compoundId}-statement-atom-${atom.entity.id}-list-item`
      return (
        <StatementCompoundViewerAtomListItem id={listItemId}
                                             key={listItemId}
                                             atom={atom}
                                             doShowControls={doShowControls}
                                             doShowJustifications={doShowStatementAtomJustifications}
                                             isCondensed={isCondensed}
                                             isUnCondensed={isUnCondensed}
        />
      )
    })

    return (
      <ol className="statement-compound-viewer">
        {atomListItems}
      </ol>
    )
  }
}
