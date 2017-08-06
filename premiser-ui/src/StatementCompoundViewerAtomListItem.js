import React, {Component} from 'react'
import ReactCSSTransitionGroup from 'react/lib/ReactCSSTransitionGroup'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import { Link } from 'react-router-dom'
import Divider from 'react-md/lib/Dividers/Divider'
import FontIcon from 'react-md/lib/FontIcons/FontIcon'

import Positions from "react-md/lib/Menus/Positions";
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
import StatementCompoundAtomViewer from "./StatementCompoundAtomViewer";
import StatementJustifications from './StatementJustifications'
import TransientMenuButton from './TransientMenuButton'

import './StatementCompoundViewerAtomListItem.scss'


const baseId = statementAtom => `statementCompoundAtom-${statementAtom.statementCompoundId}-${statementAtom.statement.id}`
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
    const statement = this.props.statementAtom.statement
    this.props.editors.beginEdit(this.editorType, _editorId, statement)
  }

  onSeeUsages = () => {
    const {statementAtom: {statement}} = this.props
    this.props.goto.searchJustifications({statementId: statement.id})
  }

  render() {
    const {
      statementAtom,
      isEditing,
      doShowControls,
      doShowJustifications,
      isMenuVisible,
      isCondensed,
    } = this.props

    const _baseId = baseId(statementAtom)
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
                        to={paths.statement(statementAtom.statement)}
              />,
              <ListItem primaryText="See usages"
                        key="usages"
                        title="See justifications using this statement"
                        leftIcon={<FontIcon>call_merge</FontIcon>}
                        onClick={() => this.onSeeUsages()}
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

    const hasJustifications = statementAtom.statement.justifications && statementAtom.statement.justifications.length > 0

    return (
        <li className="statementAtom"
            onMouseOver={this.onMouseOver}
            onMouseLeave={this.onMouseLeave}
        >
          <ReactCSSTransitionGroup
              transitionName="context-menu--statement-atom"
              transitionEnterTimeout={500}
              transitionLeaveTimeout={300}
          >
            {!isEditing && doShowControls && isMenuVisible && menu}
          </ReactCSSTransitionGroup>
          <StatementCompoundAtomViewer id={_baseId}
                                       editorId={_editorId}
                                       statementAtom={statementAtom}
          />

          {doShowJustifications && hasJustifications &&
            <StatementJustifications id={_baseId}
                                     statement={statementAtom.statement}
                                     doShowControls={doShowControls}
                                     doShowJustifications={doShowJustifications}
                                     isCondensed={isCondensed}
            />
          }
        </li>
    )
  }
}
StatementCompoundViewerAtomListItem.propTypes = {
  statementAtom: PropTypes.object.isRequired,
  doShowJustifications: PropTypes.bool,
  doShowControls: PropTypes.bool,
}
StatementCompoundViewerAtomListItem.defaultProps = {
  doShowControls: true,
}

const mapStateToProps = (state, ownProps) => {
  const _baseId = baseId(ownProps.statementAtom)
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