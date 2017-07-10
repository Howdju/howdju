import React, {Component} from 'react'
import {connect} from "react-redux";
import Divider from 'react-md/lib/Dividers/Divider'
import FontIcon from 'react-md/lib/FontIcons/FontIcon'
import MenuButton from "react-md/lib/Menus/MenuButton"
import Menu from "react-md/lib/Menus/Menu"
import Paper from 'react-md/lib/Papers/Paper'
import ListItem from 'react-md/lib/Lists/ListItem'
import cn from 'classnames'
import get from "lodash/get";

import EditableStatement from './EditableStatement'
import {editors, goto, mapActionCreatorGroupToDispatchToProps} from "./actions";
import {EditorTypes} from "./reducers/editors";

import './StatementCompoundAtomViewer.scss'

const baseId = props => `statementCompoundAtom-${props.statementAtom.statementCompoundId}-${props.statementAtom.statement.id}`
const editorId = baseId => `${baseId}-statementEditor`

class StatementCompoundAtomViewer extends Component {

  constructor() {
    super()

    this.state = {isOver: false}
    this.editorType = EditorTypes.STATEMENT
  }

  goToStatement = () => {
    this.props.goto.statement(this.props.atom.statement)
  }

  onEditStatement = () => {
    const _editorId = editorId(baseId(this.props))
    const statement = this.props.statementAtom.statement
    this.props.editors.beginEdit(this.editorType, _editorId, statement)
  }

  onMouseOver = () => {
    this.setState({isOver: true})
  }

  onMouseLeave = () => {
    this.setState({isOver: false})
  }

  render() {
    const {
      statementAtom,
      isEditing,
    } = this.props
    const {
      isOver
    } = this.state

    const statement = statementAtom.statement
    const _baseId = baseId(this.props)
    const _editorId = editorId(_baseId)

    const menu = (
        <MenuButton
            icon
            id={`${_baseId}-context-menu`}
            className={cn({hiding: !isOver})}
            menuClassName="contextMenu statementAtomJustificationMenu"
            children={'more_vert'}
            position={Menu.Positions.TOP_RIGHT}
            menuItems={[
              <ListItem primaryText="Go To"
                        key="goTo"
                        leftIcon={<FontIcon>forward</FontIcon>}
                        onClick={this.goToStatement}
              />,
              <Divider key="divider" />,
              <ListItem primaryText="Edit"
                        key="edit"
                        leftIcon={<FontIcon>create</FontIcon>}
                        onClick={this.onEditStatement}
              />,
            ]}
        >
        </MenuButton>
    )

    return (
        <Paper className="statementCompoundAtomViewer"
               onMouseOver={this.onMouseOver}
               onMouseLeave={this.onMouseLeave}
        >
          {!isEditing && menu}
          <EditableStatement id={`${_baseId}-statement`}
                             entityId={statement.id}
                             editorId={_editorId}
                             textId={`${_baseId}-statementText`}
                             suggestionsKey={`${_baseId}-statementSuggestions`}
          />
        </Paper>
    )
  }
}

const mapStateToProps = (state, ownProps) => {
  const _baseId = baseId(ownProps)
  const _editorId = editorId(_baseId)
  const editEntity = get(state, ['editors', EditorTypes.STATEMENT, _editorId, 'editEntity'])
  const isEditing = !!editEntity
  return {
    isEditing
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
  goto,
}))(StatementCompoundAtomViewer)
