import React, {Component} from 'react'
import PropTypes from 'prop-types'
import map from 'lodash/map'

import JustificationBasisCompoundViewerAtomListItem from "./JustificationBasisCompoundViewerAtomListItem"

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

    const compoundId = `${id}-justification-basis-compound`

    return (
      <ol className="compound-viewer justification-basis-compound-viewer">
        {map(justificationBasisCompound.atoms, atom => {
          const atomId = `${compoundId}-atom-${atom.id}`
          return (
            <JustificationBasisCompoundViewerAtomListItem
              atom={atom}
              id={atomId}
              key={atomId}
              doShowControls={doShowControls}
              doShowStatementAtomJustifications={doShowStatementAtomJustifications}
              isCondensed={isCondensed}
              isUnCondensed={isUnCondensed}
            />
          )
        })}
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