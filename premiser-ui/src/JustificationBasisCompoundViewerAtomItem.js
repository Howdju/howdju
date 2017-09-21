import React, {Component} from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'
import PropTypes from 'prop-types'
import Paper from 'react-md/lib/Papers/Paper'
import MenuButton from 'react-md/lib/Menus/MenuButton'
import Positions from 'react-md/lib/Menus/Positions'
import ListItem from 'react-md/lib/Lists/ListItem'
import FontIcon from 'react-md/lib/FontIcons/FontIcon'
import Divider from 'react-md/lib/Dividers/Divider'
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
import StatementJustificationTrees from './StatementJustificationTrees'

class JustificationBasisCompoundViewerAtomListItem extends Component {

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

  statementEditorId() {
    const {
      id,
    } = this.props
    return `${id}--atom-entity-editor--statement`
  }

  paraphrasingStatementEditorId() {
    const {
      id,
    } = this.props
    return `${id}--atom-entity-editor--paraphrasing-statement`
  }

  sourceExcerptParaphraseEditorId() {
    const {
      id,
    } = this.props
    return `${id}--atom-entity-editor--source-excerpt-paraphrase`
  }

  onEditStatement = () => {
    const {
      atom
    } = this.props
    this.props.editors.beginEdit(EditorTypes.STATEMENT, this.statementEditorId(), atom.entity)
  }

  onEditParaphrasingStatement = () => {
    const {
      atom
    } = this.props
    this.props.editors.beginEdit(EditorTypes.STATEMENT, this.paraphrasingStatementEditorId(), atom.entity.paraphrasingStatement)
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
      doShowStatementAtomJustifications,
      isCondensed,
      isUnCondensed,
      itemComponent,
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
        className={cn({hidden: !isOver || !doShowControls})}
        menuClassName="context-menu"
        buttonChildren={'more_vert'}
        position={Positions.TOP_RIGHT}
        title={menuTitle(atom)}
        children={this.menuListItems()}
      />
    )

    return (
      <Paper id={listItemId}
             key={listItemId}
             className="compound-atom justification-basis-compound-atom"
             component={itemComponent}
             onMouseOver={this.onMouseOver}
             onMouseLeave={this.onMouseLeave}
      >
        {menu}
        <JustificationBasisCompoundAtomViewer id={id}
                                              key={id}
                                              atom={atom}
                                              statementEditorId={this.statementEditorId()}
                                              paraphrasingStatementEditorId={this.paraphrasingStatementEditorId()}
                                              sourceExcerptEditorId={this.sourceExcerptParaphraseEditorId()}
                                              doShowControls={doShowControls}
                                              doShowJustifications={doShowStatementAtomJustifications}
                                              isCondensed={isCondensed}
                                              isUnCondensed={isUnCondensed}
        />

        {doShowStatementAtomJustifications && hasJustifications && (
          <StatementJustificationTrees id={`${id}-justification-trees`}
                                       justifications={justifications}
                                       doShowControls={doShowControls}
                                       doShowJustifications={doShowStatementAtomJustifications}
                                       isCondensed={isCondensed}
                                       isUnCondensed={isUnCondensed}
          />
        )}
      </Paper>
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
                title="See justifications using this basis"
                leftIcon={<FontIcon>call_merge</FontIcon>}
                component={Link}
                to={seeBasisUsagesPath(atom)}
      />,
      <Divider key="divider" />,
    ]

    switch (atom.type) {
      case JustificationBasisCompoundAtomType.STATEMENT: {
        const gotoStatementListItem = (
          <ListItem primaryText="Go to"
                    key="go-to-statement"
                    title="View all of this statement's justifications"
                    leftIcon={<FontIcon>forward</FontIcon>}
                    component={Link}
                    to={paths.statement(atom.entity)}
          />
        )
        insertAt(menuListItems, 2, gotoStatementListItem)

        const editStatementListItem = (
          <ListItem primaryText="Edit"
                    key="edit-statement"
                    leftIcon={<FontIcon>create</FontIcon>}
                    onClick={this.onEditStatement}
          />
        )
        menuListItems.push(editStatementListItem)
        break
      }
      case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE: {
        const seeUsagesListItems = [
          <ListItem primaryText="See statement usages"
                    key="paraphrasing-statement-usages"
                    title="See justifications using this paraphrasing statement"
                    leftIcon={<FontIcon>call_merge</FontIcon>}
                    component={Link}
                    to={paths.searchJustifications({statementId: atom.entity.paraphrasingStatement.id})}
          />,
          <ListItem primaryText="See excerpt usages"
                    key="source-excerpt-usages"
                    title="See justifications using this excerpt"
                    leftIcon={<FontIcon>call_merge</FontIcon>}
                    component={Link}
                    to={seeSourceExcerptUsagesPath(atom.entity.sourceExcerpt)}
          />,
        ]
        insertAllAt(menuListItems, 2, seeUsagesListItems)

        pushAll(menuListItems, [
          <ListItem primaryText="Edit statement"
                    key="edit-paraphrasing-statement"
                    leftIcon={<FontIcon>create</FontIcon>}
                    onClick={this.onEditParaphrasingStatement}
          />,
          <ListItem primaryText="Edit excerpt"
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
JustificationBasisCompoundViewerAtomListItem.propTypes = {
  id: PropTypes.string.isRequired,
  atom: PropTypes.object.isRequired,
  doShowControls: PropTypes.bool,
  doShowStatementAtomJustifications: PropTypes.bool,
  isCondensed: PropTypes.bool,
  isUnCondensed: PropTypes.bool,
  /** The component as which the item will be rendered */
  itemComponent: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.func,
  ])
}
JustificationBasisCompoundViewerAtomListItem.defaultProps = {
  doShowControls: true,
  doShowStatementAtomJustifications: false,
  isCondensed: false,
  isUnCondensed: false,
  itemComponent: 'li',
}

function menuTitle(atom) {
  switch (atom.type) {
    case JustificationBasisCompoundAtomType.STATEMENT:
      return 'Statement actions'
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      return 'Paraphrase actions'
    default:
      throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
  }
}

function atomEntityDescription(atom) {
  switch (atom.type) {
    case JustificationBasisCompoundAtomType.STATEMENT:
      return 'statement'
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      return 'paraphrase'
    default:
      throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
  }
}

function seeBasisUsagesPath(atom) {
  const params = {}

  switch (atom.type) {
    case JustificationBasisCompoundAtomType.STATEMENT:
      params.statementId = atom.entity.id
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

function createJustificationPath(atom) {
  switch (atom.type) {
    case JustificationBasisCompoundAtomType.STATEMENT:
      return paths.createJustification(JustificationBasisSourceType.STATEMENT, atom.entity.id)
    case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
      return paths.createJustification(JustificationBasisSourceType.SOURCE_EXCERPT_PARAPHRASE, atom.entity.id)
    default:
      throw newExhaustedEnumError('JustificationBasisCompoundAtomType', atom.type)
  }
}

export default connect(null, mapActionCreatorGroupToDispatchToProps({
  editors
}))(JustificationBasisCompoundViewerAtomListItem)