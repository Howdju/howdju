import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import Button from 'react-md/lib/Buttons/Button'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import CardActions from 'react-md/lib/Cards/CardActions'
import CardText from 'react-md/lib/Cards/CardText'
import FocusContainer from 'react-md/lib/Helpers/FocusContainer'
import get from 'lodash/get'

import StatementCompoundEditorFields from "./StatementCompoundEditorFields"
import {EditorTypes} from "./reducers/editors"
import {
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import t, {
  CANCEL_BUTTON_LABEL,
  COUNTER_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
} from "./texts"


class CounterJustificationEditor extends Component {
  constructor() {
    super()

    this.editorType = EditorTypes.COUNTER_JUSTIFICATION
  }

  onPropertyChange = (properties) => {
    this.props.editors.propertyChange(this.editorType, this.props.editorId, properties)
  }

  onAddStatementCompoundAtom = () => {
    this.props.editors.addStatementCompoundAtom(this.editorType, this.props.editorId)
  }

  onRemoveStatementCompoundAtom = (atom, index) => {
    this.props.editors.removeStatementCompoundAtom(this.editorType, this.props.editorId, atom, index)
  }

  onSubmit = (event) => {
    event.preventDefault()
    this.props.editors.commitEdit(this.editorType, this.props.editorId)
  }

  onCancelEdit = () => {
    this.props.editors.cancelEdit(this.editorType, this.props.editorId)
  }

  render() {
    const {
      suggestionsKey,
      textId,
      editorState: {
        errors,
        editEntity,
        isSaving,
      },
      ...rest,
    } = this.props
    delete rest.editors
    delete rest.editorId

    const statementCompoundErrors = get(errors, 'fieldErrors.basis.fieldErrors.entity')
    const statementCompound = get(editEntity, 'basis.entity')

    return (
      <form onSubmit={this.onSubmit}>
        <CardText>
          <FocusContainer containFocus={false} focusOnMount={true}>
            <StatementCompoundEditorFields
              {...rest}
              name="basis.entity"
              statementCompound={statementCompound}
              textId={textId}
              suggestionsKey={suggestionsKey}
              onPropertyChange={this.onPropertyChange}
              disabled={isSaving}
              errors={statementCompoundErrors}
              onAddStatementCompoundAtom={this.onAddStatementCompoundAtom}
              onRemoveStatementCompoundAtom={this.onRemoveStatementCompoundAtom}
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
  textId: PropTypes.string.isRequired,
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