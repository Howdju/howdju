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
    } = this.props

    const atomListItems = map(statementCompound.atoms, atom => {
      const atomId = `${id}statement-compound-${atom.statementCompoundId}-statement-atom-${atom.statement.id}-list-item`
      return (
          <StatementCompoundViewerAtomListItem id={atomId}
                                               key={atomId}
                                               statementAtom={atom}
                                               doShowControls={doShowControls}
                                               doShowJustifications={doShowStatementAtomJustifications}
                                               isCondensed={isCondensed}
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
