import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux";
import Button from 'react-md/lib/Buttons/Button'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import CardActions from 'react-md/lib/Cards/CardActions';
import CardText from 'react-md/lib/Cards/CardText';
import get from 'lodash/get'

import {
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {EditorTypes} from "./reducers/editors";
import StatementEditorFields from "./StatementEditorFields";
import {
  CANCEL_BUTTON_LABEL, EDIT_STATEMENT_SUBMIT_BUTTON_LABEL
} from "./texts";
import {default as t} from './texts'

class StatementEditor extends Component {

  constructor() {
    super()

    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancelEdit = this.onCancelEdit.bind(this)
  }

  onPropertyChange(properties) {
    this.props.editors.propertyChange(StatementEditor.editorType, this.props.editorId, properties)
  }

  onSubmit(event) {
    event.preventDefault()
    this.props.editors.commitEdit(StatementEditor.editorType, this.props.editorId)
  }

  onCancelEdit() {
    this.props.editors.cancelEdit(StatementEditor.editorType, this.props.editorId)
  }

  render() {
    const {
      suggestionsKey,
      editorState: {
        errors,
        editEntity,
        isFetching,
        isSaving,
      },
      ...rest,
    } = this.props
    delete rest.editors
    delete rest.editorId

    const inProgress = isFetching || isSaving

    return (
        <form onSubmit={this.onSubmit}>
          <CardText>
            <StatementEditorFields {...rest}
                                   statement={editEntity}
                                   disabled={isSaving}
                                   suggestionsKey={suggestionsKey}
                                   onPropertyChange={this.onPropertyChange}
                                   errors={errors}
            />
          </CardText>
          <CardActions>
            {inProgress && <CircularProgress key="progress" id="progress" />}
            <Button flat
                    key="cancelButton"
                    label={t(CANCEL_BUTTON_LABEL)}
                    onClick={this.onCancelEdit}
                    disabled={inProgress}
            />
            <Button raised
                    primary
                    key="submitButton"
                    type="submit"
                    label={t(EDIT_STATEMENT_SUBMIT_BUTTON_LABEL)}
                    disabled={inProgress}
            />
          </CardActions>
        </form>
    )
  }
}
StatementEditor.propTypes = {
  /** Identifies the editor's state */
  editorId: PropTypes.string.isRequired,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  disabled: PropTypes.bool,
}
StatementEditor.editorType = EditorTypes.STATEMENT

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [StatementEditor.editorType, ownProps.editorId], {})
  return {
    editorState,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
}))(StatementEditor)