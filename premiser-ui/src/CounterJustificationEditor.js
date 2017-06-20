import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import Button from 'react-md/lib/Buttons/Button'
import FocusContainer from 'react-md/lib/Helpers/FocusContainer'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import CardActions from 'react-md/lib/Cards/CardActions';
import CardText from 'react-md/lib/Cards/CardText';
import get from 'lodash/get'

import StatementEditorFields from "./StatementEditorFields";
import {EditorTypes} from "./reducers/editors";
import {
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {
  default as t,
  CANCEL_BUTTON_LABEL,
  COUNTER_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
} from "./texts";


class CounterJustificationEditor extends Component {
  constructor() {
    super()

    this.editorType = EditorTypes.COUNTER_JUSTIFICATION

    this.onPropertyChange = this.onPropertyChange.bind(this)
    this.onSubmit = this.onSubmit.bind(this)
    this.onCancelEdit = this.onCancelEdit.bind(this)
  }

  onPropertyChange(properties) {
    this.props.editors.propertyChange(this.editorType, this.props.editorId, properties)
  }

  onSubmit(event) {
    event.preventDefault()
    this.props.editors.commitEdit(this.editorType, this.props.editorId)
  }

  onCancelEdit() {
    this.props.editors.cancelEdit(this.editorType, this.props.editorId)
  }

  render() {
    const {
      suggestionsKey,
      editorState: {
        errors,
        editEntity,
        isSaving,
      },
      ...rest,
    } = this.props
    delete rest.editors
    delete rest.editorId

    const statementErrors = get(errors, 'fieldErrors.basis.fieldErrors.entity')

    return (
        <form onSubmit={this.onSubmit}>
          <CardText>
            <FocusContainer focusOnMount>
              <StatementEditorFields
                  {...rest}
                  name="basis.entity"
                  statement={editEntity}
                  suggestionsKey={suggestionsKey}
                  onPropertyChange={this.onPropertyChange}
                  disabled={isSaving}
                  errors={statementErrors}
              />
            </FocusContainer>
          </CardText>
          <CardActions>
            {isSaving && <CircularProgress key="progress" id="progress" />}
            <Button flat
                    key="cancelButton"
                    label={t(CANCEL_BUTTON_LABEL)}
                    onClick={this.onCancelEdit}
                    disabled={isSaving}
            />
            <Button raised
                    primary
                    key="submitButton"
                    type="submit"
                    label={t(COUNTER_JUSTIFICATION_SUBMIT_BUTTON_LABEL)}
                    disabled={isSaving}
            />
          </CardActions>
        </form>
    )
  }
}
CounterJustificationEditor.propTypes = {
  /** Identifies the editor's state */
  editorId: PropTypes.string.isRequired,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
}

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [EditorTypes.COUNTER_JUSTIFICATION, ownProps.editorId], {})
  return {
    editorState,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
}))(CounterJustificationEditor)