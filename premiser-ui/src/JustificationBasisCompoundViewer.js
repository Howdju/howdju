import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Paper from 'react-md/lib/Papers/Paper'
import map from 'lodash/map'

import JustificationBasisCompoundAtomViewer from './JustificationBasisCompoundAtomViewer'
import StatementJustificationTrees from './StatementJustificationTrees'

import './JustificationBasisCompoundViewer.scss'

export default class JustificationBasisCompoundViewer extends Component {

  render() {
    const {
      id,
      justificationBasisCompound,
      doShowControls,
      doShowStatementAtomJustifications,
      isCondensed,
      isUnCondensed,
    } = this.props

    const atomListItems = map(justificationBasisCompound.atoms, atom => {
      const atomId = `${id}-justification-basis-compound-${atom.compoundId}-atom-${atom.entity.id}`
      const listItemId = `${atomId}-list-item`

      const justifications = atom.entity.justifications
      const hasJustifications = justifications && justifications.length > 0

      return (
        <Paper id={listItemId}
               key={listItemId}
               className="justification-basis-compound-atom"
               component='li'
        >
          <JustificationBasisCompoundAtomViewer id={atomId}
                                                key={atomId}
                                                atom={atom}
                                                doShowControls={doShowControls}
                                                doShowJustifications={doShowStatementAtomJustifications}
                                                isCondensed={isCondensed}
                                                isUnCondensed={isUnCondensed}
          />

          {doShowStatementAtomJustifications && hasJustifications && (
            <StatementJustificationTrees id={`${atomId}-justification-trees`}
                                         justifications={justifications}
                                         doShowControls={doShowControls}
                                         doShowJustifications={doShowStatementAtomJustifications}
                                         isCondensed={isCondensed}
                                         isUnCondensed={isUnCondensed}
            />
          )}
        </Paper>
      )
    })

    return (
      <ol className="justification-basis-compound-viewer">
        {atomListItems}
      </ol>
    )
  }
}
JustificationBasisCompoundViewer.propTypes = {
  id: PropTypes.string.isRequired,
  justificationBasisCompound: PropTypes.object.isRequired,
  doShowControls: PropTypes.bool,
  doShowStatementAtomJustifications: PropTypes.bool,
  isCondensed: PropTypes.bool,
  isUnCondensed: PropTypes.bool,
}
JustificationBasisCompoundViewer.defaultProps = {
  doShowControls: true,
  doShowStatementAtomJustifications: false,
  isCondensed: false,
  isUnCondensed: false,
}
