import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux";
import CircularProgress from "react-md/lib/Progress/CircularProgress";
import Button from "react-md/lib/Buttons"
import get from 'lodash/get'

import {
  editors, 
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {EditorTypes} from "./reducers/editors";
import StatementEditor from "./StatementEditor";
import StatementViewer from "./StatementViewer";
import {
  CANCEL_BUTTON_LABEL, EDIT_STATEMENT_SUBMIT_BUTTON_LABEL
} from "./texts";
import {default as t} from './texts'

class EditableStatement extends Component {

  constructor() {
    super()

    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancelEdit = this.onCancelEdit.bind(this)
  }

  componentWillMount() {
    // TODO this may not fire before the FETCH action from parent component fires.  So need to intercept these in sagas somehow
    this.props.editors.init(EditorTypes.STATEMENT, this.props.editorId, this.props.entityId)
  }

  componentWillReceiveProps(nextProps) {
    // console.log(this.props, nextProps)
    if (nextProps.editorId !== this.props.editorId) {
      this.props.editors.init(EditorTypes.STATEMENT, this.props.editorId, nextProps.entityId)
    }
  }

  onPropertyChange(properties) {
    this.props.editors.propertyChange(EditorTypes.STATEMENT, this.props.editorId, properties)
  }

  onSubmit(event) {
    event.preventDefault()
    this.props.editors.commitEdit(EditorTypes.STATEMENT, this.props.editorId, this.props.editEntity)
  }

  onCancelEdit() {
    this.props.editors.cancelEdit(EditorTypes.STATEMENT, this.props.editorId)
  }

  render() {
    const {
      statement,
      suggestionsKey,
      name,
      id,
      isFetching,
      editorState: {
        editEntity,
        isSaving,
      },
    } = this.props

    const isEditing = !!editEntity

    // statement is required, so make this lazy.  Is this a problem for react efficiency-wise?
    const statementEditor = () =>
        <form onSubmit={this.onSubmit}>
          <StatementEditor id={id}
                           name={name}
                           statement={editEntity}
                           disabled={isSaving}
                           suggestionsKey={suggestionsKey}
                           onPropertyChange={this.onPropertyChange}
          />
          <Button flat
                  key="cancelButton"
                  label={t(CANCEL_BUTTON_LABEL)}
                  onClick={this.onCancelEdit} />
          <Button flat
                  primary
                  key="submitButton"
                  type="submit"
                  label={t(EDIT_STATEMENT_SUBMIT_BUTTON_LABEL)}
                  disabled={isSaving}
          />
        </form>
    const statementViewer =
        <StatementViewer statement={statement}/>
    const progress =
        <CircularProgress id={`${id}-Progress`} />

    return isEditing ?
        statementEditor() :
        isFetching ? progress : statementViewer
  }
}
EditableStatement.propTypes = {
  /** Let's the component fetch its statement from the API and retrieve it from the state */
  entityId: PropTypes.string.isRequired,
  /** Identifies the editor's state */
  editorId: PropTypes.string.isRequired,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
}

const mapStateToProps = (state, ownProps) => {
  const statement = state.entities.statements[ownProps.entityId]
  const editorState = get(state.editors, [EditorTypes.STATEMENT, ownProps.editorId], {})
  return {
    statement,
    editorState,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
}))(EditableStatement)