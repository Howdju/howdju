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
import {
  combineIds,
  combineSuggestionsKeys,
} from './viewModels'
import {EditorTypes} from './reducers/editors'
import PropositionEntityViewer from "./PropositionEntityViewer"
import JustificationsTree from './JustificationsTree'

import './PropositionCompoundViewerAtomItem.scss'


class PropositionCompoundViewerAtomItem extends Component {

  constructor() {
    super()

    this.editorType = EditorTypes.PROPOSITION
  }

  // onEditProposition = () => {
  //   const _editorId = editorId(baseId(this.props))
  //   const proposition = this.props.atom.entity
  //   this.props.editors.beginEdit(this.editorType, _editorId, proposition)
  // }
  //
  // seeUsagesPath = () => {
  //   const {atom: {entity}} = this.props
  //   return paths.searchJustifications({propositionId: entity.id})
  // }

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
      showStatusText,
      contextTrailItems,
    } = this.props

    const hasJustifications = atom.entity.justifications && atom.entity.justifications.length > 0
    const justifications = atom.entity.justifications

    return (
      <Component
        id={id}
        className="compound-atom proposition-atom"
      >
        <PropositionEntityViewer
          id={combineIds(id, 'proposition')}
          proposition={atom.entity}
          editorId={propositionEditorId(this.props)}
          suggestionsKey={combineSuggestionsKeys(id, 'proposition')}
          doShowControls={doShowControls}
          showStatusText={showStatusText}
          contextTrailItems={contextTrailItems}
        />
        {doShowJustifications && hasJustifications && (
          <JustificationsTree
            id={combineIds(id, 'justificationsTree')}
            justifications={justifications}
            doShowControls={doShowControls}
            doShowJustifications={doShowJustifications}
            isCondensed={isCondensed}
            isUnCondensed={isUnCondensed}
            showBasisUrls={showBasisUrls}
            contextTrailItems={contextTrailItems}
          />
        )}
      </Component>
    )
  }
}
PropositionCompoundViewerAtomItem.propTypes = {
  /** Used to identify the context menu */
  id: PropTypes.string.isRequired,
  atom: PropTypes.object.isRequired,
  doShowJustifications: PropTypes.bool,
  doShowControls: PropTypes.bool,
  showStatusText: PropTypes.bool,
}
PropositionCompoundViewerAtomItem.defaultProps = {
  doShowControls: true,
}

function propositionEditorId(props) {
  return combineIds(props.id, 'proposition')
}

const mapStateToProps = (state, ownProps) => {
  const {editEntity} = get(state, ['editors', EditorTypes.PROPOSITION, propositionEditorId(ownProps)], {})
  const isEditing = !!editEntity
  return {
    isEditing,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
  goto,
  ui,
}))(PropositionCompoundViewerAtomItem)