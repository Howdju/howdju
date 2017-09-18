import React, {Component} from 'react'
import ReactCSSTransitionGroup from 'react/lib/ReactCSSTransitionGroup'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import { Link } from 'react-router-dom'
import Divider from 'react-md/lib/Dividers/Divider'
import FontIcon from 'react-md/lib/FontIcons/FontIcon'
import Paper from 'react-md/lib/Papers/Paper'

import Positions from "react-md/lib/Menus/Positions"
import ListItem from 'react-md/lib/Lists/ListItem'
import get from 'lodash/get'

import {
  editors,
  goto,
  ui,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import paths from './paths'
import {EditorTypes} from './reducers/editors'
import StatementAtomViewer from "./StatementAtomViewer"
import StatementJustificationTrees from './StatementJustificationTrees'
import TransientMenuButton from './TransientMenuButton'

import './StatementCompoundViewerAtomListItem.scss'


const baseId = props => {
  const {
    id,
    atom
  } = props
  const idPrefix = id ? id + '-' : ''
  return `${idPrefix}statementCompoundAtom-${atom.compoundId}-${atom.entity.id}`
}
const editorId = baseId => `${baseId}-statementEditor`

class StatementCompoundViewerAtomListItem extends Component {

  constructor() {
    super()

    this.editorType = EditorTypes.STATEMENT
  }

  onMouseOver = () => {
    this.props.ui.beginInteractionWithTransient(this.props.id)
  }

  onMouseLeave = () => {
    this.props.ui.endInteractionWithTransient(this.props.id)
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
      isEditing,
      doShowControls,
      doShowJustifications,
      isMenuVisible,
      isCondensed,
      isUnCondensed,
    } = this.props

    const _baseId = baseId(this.props)
    const _editorId = editorId(_baseId)

    const menuId = `${_baseId}-context-menu`
    const menu = (
      <TransientMenuButton
        id={menuId}
        key={menuId}
        menuClassName="context-menu context-menu--statement-atom context-menu--floating"
        buttonChildren="more_vert"
        position={Positions.TOP_RIGHT}
        title="Statement actions"
        children={[
          <ListItem primaryText="Go To"
                    key="goTo"
                    leftIcon={<FontIcon>forward</FontIcon>}
                    component={Link}
                    to={paths.statement(atom.entity)}
          />,
          <ListItem primaryText="See usages"
                    key="usages"
                    title="See justifications using this statement"
                    leftIcon={<FontIcon>call_merge</FontIcon>}
                    component={Link}
                    to={this.seeUsagesPath()}
          />,
          <Divider key="divider" />,
          <ListItem primaryText="Edit"
                    key="edit"
                    leftIcon={<FontIcon>create</FontIcon>}
                    onClick={this.onEditStatement}
          />,
        ]}
      />
    )

    const hasJustifications = atom.entity.justifications && atom.entity.justifications.length > 0
    const justifications = atom.entity.justifications

    return (
      <Paper id={id}
             className="statement-atom"
             component='li'
             // onMouseOver={this.onMouseOver}
             // onMouseLeave={this.onMouseLeave}
      >
        <ReactCSSTransitionGroup
          transitionName="context-menu--statement-atom"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={300}
        >
          {!isEditing && doShowControls && isMenuVisible && menu}
        </ReactCSSTransitionGroup>
        <StatementAtomViewer id={_baseId}
                             editorId={_editorId}
                             atom={atom}
        />

        {doShowJustifications && hasJustifications && (
          <StatementJustificationTrees id={_baseId}
                                       justifications={justifications}
                                       doShowControls={doShowControls}
                                       doShowJustifications={doShowJustifications}
                                       isCondensed={isCondensed}
                                       isUnCondensed={isUnCondensed}
          />
        )}
      </Paper>
    )
  }
}
StatementCompoundViewerAtomListItem.propTypes = {
  /** Used to identify the context menu */
  id: PropTypes.string.isRequired,
  atom: PropTypes.object.isRequired,
  doShowJustifications: PropTypes.bool,
  doShowControls: PropTypes.bool,
}
StatementCompoundViewerAtomListItem.defaultProps = {
  doShowControls: true,
}

const mapStateToProps = (state, ownProps) => {
  const _baseId = baseId(ownProps)
  const _editorId = editorId(_baseId)
  const editEntity = get(state, ['editors', EditorTypes.STATEMENT, _editorId, 'editEntity'])
  const isEditing = !!editEntity

  const isMenuVisible = get(state, ['ui', 'transients', ownProps.id, 'isVisible'], false)
  return {
    isEditing,
    isMenuVisible,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
  goto,
  ui,
}))(StatementCompoundViewerAtomListItem)