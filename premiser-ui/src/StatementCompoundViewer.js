import React, {Component} from 'react'
import map from 'lodash/map'

import './StatementCompoundViewer.scss'
import StatementCompoundAtomViewer from "./StatementCompoundAtomViewer";

export default class StatementCompoundViewer extends Component {

  render() {
    const {
      statementCompound
    } = this.props

    const atomListItems = map(statementCompound.atoms, atom => {
      const id = `statement-compound-atom-${atom.statementCompoundId}-${atom.statement.id}-list-item`
      return (
          <li id={id} key={id} className="statementAtom">
            <StatementCompoundAtomViewer statementAtom={atom}/>
          </li>
      )
    })

    return (
        <ul className="statementCompoundViewer">
          {atomListItems}
        </ul>
    )
  }
}
