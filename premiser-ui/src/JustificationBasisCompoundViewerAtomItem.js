import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'
import PropTypes from 'prop-types'
import {
  CardText,
  MenuButton,
  ListItem,
  FontIcon,
  Divider,
} from 'react-md'
import cn from 'classnames'

import {
  JustificationBasisCompoundAtomType,
  insertAt,
  newExhaustedEnumError,
  JustificationBasisSourceType,
  pushAll,
  insertAllAt,
  SourceExcerptType,
} from 'howdju-common'

import {
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {EditorTypes} from './reducers/editors'
import paths from './paths'
import JustificationBasisCompoundAtomViewer from './JustificationBasisCompoundAtomViewer'
import JustificationsTree from './JustificationsTree'
import {
  sourceExcerptDescription,
  sourceExcerptSourceDescription,
} from './viewModels'

import './JustificationBasisCompoundViewerAtomItem.scss'


class JustificationBasisCompoundViewerAtomItem extends Component {

  constructor() {
    super()

    this.state = {
      isOver: false,
    }
  }

  onMouseOver = () => {
    this.setState({isOver: true})
  }

  onMouseLeave = () => {
    this.setState({isOver: false})
  }

  propositionEditorId() {
    const {
      id,
    } = this.props
    return `${id}--atom-entity-editor--proposition`
  }

  paraphrasingPropositionEditorId() {
    const {
      id,
    } = this.props
    return `${id}--atom-entity-editor--paraphrasing-proposition`
  }

  sourceExcerptParaphraseEditorId() {
    const {
      id,
    } = this.props
    return `${id}--atom-entity-editor--source-excerpt-paraphrase`
  }

  onEditProposition = () => {
    const {
      atom
    } = this.props
    this.props.editors.beginEdit(EditorTypes.PROPOSITION, this.propositionEditorId(), atom.entity)
  }

  onEditParaphrasingProposition = () => {
    const {
      atom
    } = this.props
    this.props.editors.beginEdit(EditorTypes.PROPOSITION, this.paraphrasingPropositionEditorId(), atom.entity.paraphrasingProposition)
  }

  onEditSourceExcerpt = () => {
    const {
      atom
    } = this.props
    const editorTypeBySourceExcerptType = {
      [SourceExcerptType.WRIT_QUOTE]: EditorTypes.WRIT_QUOTE,
      [SourceExcerptType.PIC_REGION]: EditorTypes.PIC_REGION,
      [SourceExcerptType.VID_SEGMENT]: EditorTypes.VID_SEGMENT,
    }
    const editorType = editorTypeBySourceExcerptType[atom.entity.sourceExcerpt.type]
    if (!editorType) {
      throw newExhaustedEnumError('SourceExcerptType', atom.entity.sourceExcerpt.type)
    }
    this.props.editors.beginEdit(editorType, this.sourceExcerptParaphraseEditorId(), atom.entity.sourceExcerpt.entity)
  }

  render() {
    const {
      id,
      atom,
      doShowControls,
      doShowPropositionAtomJustifications,
      isCondensed,
      isUnCondensed,
      component: Component,
      showStatusText,
      showUrls,
      trailPropositions,
    } = this.props
    const {
      isOver
    } = this.state

    const listItemId = `${id}-list-item`

    const justifications = atom.entity.justifications
    const hasJustifications = justifications && justifications.length > 0

    const menu = (
      <MenuButton
        icon
        id={`${id}-context-menu`}
        className={cn({hidden: !isOver})}
        menuClassName="context-menu"
        children={'more_vert'}
        position={MenuButton.Positions.TOP_RIGHT}
        title={menuTitle(atom)}
        menuItems={this.menuListItems()}
      />
    )

    return (
      <Component
        id={listItemId}
        key={listItemId}
        className="compound-atom"
        onMouseOver={this.onMouseOver}
        onMouseLeave={this.onMouseLeave}
      >
        <div className="justification-basis-compound-atom-viewer-and-menu">
          <JustificationBasisCompoundAtomViewer
            id={id}
            key={id}
            atom={atom}
            component={CardText}
            propositionEditorId={this.propositionEditorId()}
            paraphrasingPropositionEditorId={this.paraphrasingPropositionEditorId()}
            sourceExcerptEditorId={this.sourceExcerptParaphraseEditorId()}
            showStatusText={showStatusText}
            doShowControls={doShowControls}
            doShowJustifications={doShowPropositionAtomJustifications}
            isCondensed={isCondensed}
            isUnCondensed={isUnCondensed}
            showUrls={showUrls}
            trailPropositions={trailPropositions}
          />
          {doShowControls && menu}
        </div>

        {doShowPropositionAtomJustifications && hasJustifications && (
          <JustificationsTree
            id={`${id}-justification-trees`}
            justifications={justifications}
            doShowControls={doShowControls}
            doShowJustifications={doShowPropositionAtomJustifications}
            isCondensed={isCondensed}
            isUnCondensed={isUnCondensed}
            showBasisUrls={showUrls}
            trailPropositions={trailPropositions}
          />
        )}
      </Component>
    )
  }

  menuListItems = () => {
    const {
      atom
    } = this.props

    const menuListItems = [
      <ListItem primaryText="Use"
                key="use-basis"
                title={`Create a new justification using this ${atomEntityDescription(atom)}`}
                leftIcon={<FontIcon>call_made</FontIcon>}
                component={Link}
                to={createJustificationPath(atom)}
      />,
      <ListItem primaryText="See usages"
                key="basis-usages"
                title="See justifications using this paraphrase "
                leftIcon={<FontIcon>call_merge</FontIcon>}
                component={Link}
                to={seeBasisUsagesPath(atom)}
      />,
      <Divider key="divider" />,
    ]

    switch (atom.type) {
      case JustificationBasisCompoundAtomType.PROPOSITION: {
        const gotoPropositionListItem = (
          <ListItem primaryText="Go to"
                    key="go-to-proposition"
                    title="View all of this proposition's justifications"
                    leftIcon={<FontIcon>forward</FontIcon>}
                    component={Link}
                    to={paths.proposition(atom.entity)}
          />
        )
        insertAt(menuListItems, 2, gotoPropositionListItem)

        const editPropositionListItem = (
          <ListItem primaryText="Edit"
                    key="edit-proposition"
                    leftIcon={<FontIcon>create</FontIcon>}
                    onClick={this.onEditProposition}
          />
        )
        menuListItems.push(editPropositionListItem)
        break
      }
      case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE: {
        const {
          paraphrasingProposition,
          sourceExcerpt,
        } = atom.entity

        const seeUsagesListItems = [
          <ListItem primaryText="See proposition usages"
                    key="paraphrasing-proposition-usages"
                    title="See justifications using this paraphrasing proposition"
                    leftIcon={<FontIcon>call_merge</FontIcon>}
                    component={Link}
                    to={paths.searchJustifications({propositionId: paraphrasingProposition.id})}
          />,
          <ListItem primaryText={`See ${sourceExcerptDescription(sourceExcerpt)} usages`}
                    key="source-excerpt-usages"
                    title={`See justifications using this ${sourceExcerptDescription(sourceExcerpt)}`}
                    leftIcon={<FontIcon>call_merge</FontIcon>}
                    component={Link}
                    to={seeSourceExcerptUsagesPath(sourceExcerpt)}
          />,
          <ListItem primaryText={`See ${sourceExcerptSourceDescription(sourceExcerpt)} usages`}
                    key="source-excerpt-source-usages"
                    title={`See justifications using this ${sourceExcerptDescription(sourceExcerpt)}'s ${sourceExcerptSourceDescription(sourceExcerpt)}`}
                    leftIcon={<FontIcon>call_merge</FontIcon>}
                    component={Link}
                    to={seeSourceExcerptSourceUsagesPath(sourceExcerpt)}
          />,
        ]
        insertAllAt(menuListItems, 2, seeUsagesListItems)

        pushAll(menuListItems, [
          <ListItem primaryText="Edit proposition"
                    key="edit-paraphrasing-proposition"
                    leftIcon={<FontIcon>create</FontIcon>}
                    onClick={this.onEditParaphrasingProposition}
          />,
          <ListItem primaryText={`Edit ${sourceExcerptDescription(sourceExcerpt)}`}
                    key="edit-source-excerpt"
                    leftIcon={<FontIcon>create</FontIcon>}
                    onClick={this.onEditSourceExcerpt}
          />
        ])
        break
      }
      default:
        throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
    }

    return menuListItems
  }
}
JustificationBasisCompoundViewerAtomItem.propTypes = {
  id: PropTypes.string.isRequired,
  atom: PropTypes.object.isRequired,
  doShowControls: PropTypes.bool,
  doShowPropositionAtomJustifications: PropTypes.bool,
  isCondensed: PropTypes.bool,
  isUnCondensed: PropTypes.bool,
  /** The component as which the item will be rendered */
  component: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ])
}
JustificationBasisCompoundViewerAtomItem.defaultProps = {
  doShowControls: true,
  doShowPropositionAtomJustifications: false,
  isCondensed: false,
  isUnCondensed: false,
  component: 'li',
}

function menuTitle(atom) {
  switch (atom.type) {
    case JustificationBasisCompoundAtomType.PROPOSITION:
      return 'Proposition actions'
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      return 'Paraphrase actions'
    default:
      throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
  }
}

function atomEntityDescription(atom) {
  switch (atom.type) {
    case JustificationBasisCompoundAtomType.PROPOSITION:
      return 'proposition'
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      return 'paraphrase'
    default:
      throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
  }
}

function seeBasisUsagesPath(atom) {
  const params = {}

  switch (atom.type) {
    case JustificationBasisCompoundAtomType.PROPOSITION:
      params.propositionId = atom.entity.id
      break
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      params.sourceExcerptParaphraseId = atom.entity.id
      break
    default:
      throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
  }

  return paths.searchJustifications(params)
}

function seeSourceExcerptUsagesPath(sourceExcerpt) {
  const params = {}
  switch (sourceExcerpt.type) {
    case SourceExcerptType.WRIT_QUOTE:
      params.writQuoteId = sourceExcerpt.entity.id
      break
    case SourceExcerptType.PIC_REGION:
      params.picRegionId = sourceExcerpt.entity.id
      break
    case SourceExcerptType.VID_SEGMENT:
      params.vidSegmentId = sourceExcerpt.entity.id
      break
    default:
      throw newExhaustedEnumError('SourceExcerptType', sourceExcerpt.type)
  }

  return paths.searchJustifications(params)
}

function seeSourceExcerptSourceUsagesPath(sourceExcerpt) {
  const params = {}
  switch (sourceExcerpt.type) {
    case SourceExcerptType.WRIT_QUOTE:
      params.writId = sourceExcerpt.entity.writ.id
      break
    case SourceExcerptType.PIC_REGION:
      params.picId = sourceExcerpt.entity.pic.id
      break
    case SourceExcerptType.VID_SEGMENT:
      params.vidId = sourceExcerpt.entity.vid.id
      break
    default:
      throw newExhaustedEnumError('SourceExcerptType', sourceExcerpt.type)
  }

  return paths.searchJustifications(params)
}

function createJustificationPath(atom) {
  switch (atom.type) {
    case JustificationBasisCompoundAtomType.PROPOSITION:
      return paths.createJustification(JustificationBasisSourceType.PROPOSITION, atom.entity.id)
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      return paths.createJustification(JustificationBasisSourceType.SOURCE_EXCERPT_PARAPHRASE, atom.entity.id)
    default:
      throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
  }
}

export default connect(null, mapActionCreatorGroupToDispatchToProps({
  editors
}))(JustificationBasisCompoundViewerAtomItem)