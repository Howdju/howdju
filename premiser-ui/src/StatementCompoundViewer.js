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
      const listItemId = `${idPrefix}statement-compound-${atom.statementCompoundId}-statement-atom-${atom.statement.id}-list-item`
      return (
          <StatementCompoundViewerAtomListItem id={listItemId}
                                               key={listItemId}
                                               statementAtom={atom}
                                               doShowControls={doShowControls}
                                               doShowJustifications={doShowStatementAtomJustifications}
                                               isCondensed={isCondensed}
                                               isUnCondensed={isUnCondensed}
          />
      )
    })

    return (
        <ul className="statement-compound-viewer">
          {atomListItems}
        </ul>
    )
  }
}
