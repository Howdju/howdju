import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import get from 'lodash/get'

import {
  editors,
  goto,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import paths from './paths'
import {EditorTypes} from './reducers/editors'
import StatementEntityViewer from "./StatementEntityViewer"
import JustificationsTree from './JustificationsTree'

import './StatementCompoundViewerAtomItem.scss'


const baseId = props => {
  const {
    id,
    atom
  } = props
  const idPrefix = id ? id + '-' : ''
  return `${idPrefix}statementCompoundAtom-${atom.compoundId}-${atom.entity.id}`
}
const editorId = baseId => `${baseId}-statementEditor`

class StatementCompoundViewerAtomItem extends Component {

  constructor() {
    super()

    this.editorType = EditorTypes.STATEMENT
  }

  onEditStatement = () => {
    const _editorId = editorId(baseId(this.props))
    const statement = this.props.atom.entity
    this.props.editors.beginEdit(this.editorType, _editorId, statement)
  }

  seeUsagesPath = () => {
    const {atom: {entity}} = this.props
    return paths.searchJustifications({statementId: entity.id})
  }

  render() {
    const {
      id,
      atom,
      doShowControls,
      doShowJustifications,
      isCondensed,
      isUnCondensed,
      component: Component,
      showBasisUrls,
    } = this.props

    const _baseId = baseId(this.props)
    const _editorId = editorId(_baseId)

    const hasJustifications = atom.entity.justifications && atom.entity.justifications.length > 0
    const justifications = atom.entity.justifications

    return (
      <Component
        id={id}
        className="compound-atom statement-atom"
      >
        <StatementEntityViewer
          id={_baseId}
          statement={atom.entity}
          editorId={_editorId}
          suggestionsKey={`${id}-statementSuggestions`}
          doShowControls={doShowControls}
        />
        {doShowJustifications && hasJustifications && (
          <JustificationsTree
            id={_baseId}
            justifications={justifications}
            doShowControls={doShowControls}
            doShowJustifications={doShowJustifications}
            isCondensed={isCondensed}
            isUnCondensed={isUnCondensed}
            showBasisUrls={showBasisUrls}
          />
        )}
      </Component>
    )
  }
}
StatementCompoundViewerAtomItem.propTypes = {
  /** Used to identify the context menu */
  id: PropTypes.string.isRequired,
  atom: PropTypes.object.isRequired,
  doShowJustifications: PropTypes.bool,
  doShowControls: PropTypes.bool,
}
StatementCompoundViewerAtomItem.defaultProps = {
  doShowControls: true,
}

const mapStateToProps = (state, ownProps) => {
  const _baseId = baseId(ownProps)
  const _editorId = editorId(_baseId)
  const {editEntity} = get(state, ['editors', EditorTypes.STATEMENT, _editorId], {})
  const isEditing = !!editEntity
  return {
    isEditing,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
  goto,
  ui,
}))(StatementCompoundViewerAtomItem)