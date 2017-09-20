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

  sourceExcerptParaphraseEditorId() {
    const {
      id,
    } = this.props
    return `${id}--atom-entity-editor--source-excerpt-paraphrase`
  }

  onEditAtomEntity = () => {
    const {
      atom
    } = this.props
    switch (atom.type) {
      case JustificationBasisCompoundAtomType.STATEMENT:
        this.props.editors.beginEdit(EditorTypes.STATEMENT, this.statementEditorId(), atom.entity)
        break
      case JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE:
        this.props.editors.beginEdit(EditorTypes.SOURCE_EXCERPT_PARAPHRASE, this.sourceExcerptParaphraseEditorId(), atom.entity)
        break
      default:
        throw newExhaustedEnumError(JustificationBasisCompoundAtomType, atom.type)
    }
  }

  render() {
    const {
      id,
      atom,
      doShowControls,
      doShowStatementAtomJustifications,
      isCondensed,
      isUnCondensed,
    } = this.props
    const {
      isOver
    } = this.state

    const listItemId = `${id}-list-item`

    const justifications = atom.entity.justifications
    const hasJustifications = justifications && justifications.length > 0

    const menuListItems = [
      <ListItem primaryText="Use"
                key="use"
                title={`Create a new justification using this ${atomEntityDescription(atom)}`}
                leftIcon={<FontIcon>call_made</FontIcon>}
                component={Link}
                to={createJustificationPath(atom)}
      />,
      <ListItem primaryText="See usages"
                key="usages"
                title="See justifications using this basis"
                leftIcon={<FontIcon>call_merge</FontIcon>}
                component={Link}
                to={seeUsagesPath(atom)}
      />,
      <Divider key="divider" />,
      <ListItem primaryText="Edit"
                key="edit"
                leftIcon={<FontIcon>create</FontIcon>}
                onClick={this.onEditAtomEntity}
      />,
    ]
    if (atom.type === JustificationBasisCompoundAtomType.STATEMENT) {
      const gotoStatementListItem = (
        <ListItem primaryText="Go to"
                  key="link"
                  title="View all of this statement's justifications"
                  leftIcon={<FontIcon>forward</FontIcon>}
                  component={Link}
                  to={paths.statement(atom.entity)}
        />
      )
      insertAt(menuListItems, 2, gotoStatementListItem)
    }
    const menu = (
      <MenuButton
        icon
        id={`${id}-context-menu`}
        className={cn({hidden: !isOver || !doShowControls})}
        menuClassName="context-menu"
        buttonChildren={'more_vert'}
        position={Positions.TOP_RIGHT}
        title={menuTitle(atom)}
        children={menuListItems}
      />
    )

    return (
      <Paper id={listItemId}
             key={listItemId}
             className="compound-atom justification-basis-compound-atom"
             component='li'
             onMouseOver={this.onMouseOver}
             onMouseLeave={this.onMouseLeave}
      >
        {menu}
        <JustificationBasisCompoundAtomViewer id={id}
                                              key={id}
                                              atom={atom}
                                              statementEditorId={this.statementEditorId()}
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
}
JustificationBasisCompoundViewerAtomListItem.propTypes = {
  id: PropTypes.string.isRequired,
  atom: PropTypes.object.isRequired,
  doShowControls: PropTypes.bool,
  doShowStatementAtomJustifications: PropTypes.bool,
  isCondensed: PropTypes.bool,
  isUnCondensed: PropTypes.bool,
}
JustificationBasisCompoundViewerAtomListItem.defaultProps = {
  doShowControls: true,
  doShowStatementAtomJustifications: false,
  isCondensed: false,
  isUnCondensed: false,
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

function seeUsagesPath(atom) {
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