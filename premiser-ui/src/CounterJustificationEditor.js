import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import {
  Button,
  CircularProgress,
  CardActions,
  CardText,
} from 'react-md'
import get from 'lodash/get'

import PropositionCompoundEditorFields from "./PropositionCompoundEditorFields"
import {EditorTypes} from "./reducers/editors"
import {
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import t, {
  CANCEL_BUTTON_LABEL,
  COUNTER_JUSTIFICATION_SUBMIT_BUTTON_LABEL,
} from "./texts"
import {
  translateJustificationErrorsFromFormInput
} from './viewModels'


class CounterJustificationEditor extends Component {
  constructor() {
    super()

    this.editorType = EditorTypes.COUNTER_JUSTIFICATION
  }

  onPropertyChange = (properties) => {
    this.props.editors.propertyChange(this.editorType, this.props.editorId, properties)
  }

  onAddPropositionCompoundAtom = (index) => {
    this.props.editors.addPropositionCompoundAtom(this.editorType, this.props.editorId, index)
  }

  onRemovePropositionCompoundAtom = (atom, index) => {
    this.props.editors.removePropositionCompoundAtom(this.editorType, this.props.editorId, atom, index)
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
      id,
      suggestionsKey,
      editorState: {
        errors,
        editEntity,
        isSaving,
      },
      ...rest
    } = this.props
    delete rest.editors
    delete rest.editorId


    // TODO(26): counter justifications can only have proposition compounds, so we might be able to
    // get rid of this function call?
    const justificationErrors = translateJustificationErrorsFromFormInput(editEntity, errors)
    const propositionCompoundErrors = get(justificationErrors, 'fieldErrors.basis.fieldErrors.propositionCompound')
    const propositionCompound = get(editEntity, 'basis.propositionCompound')

    return (
      <form onSubmit={this.onSubmit}>
        <CardText>
          <PropositionCompoundEditorFields
            propositionCompound={propositionCompound}
            id={id}
            name="basis.propositionCompound"
            suggestionsKey={suggestionsKey}
            onPropertyChange={this.onPropertyChange}
            onSubmit={this.onSubmit}
            onAddPropositionCompoundAtom={this.onAddPropositionCompoundAtom}
            onRemovePropositionCompoundAtom={this.onRemovePropositionCompoundAtom}
            errors={propositionCompoundErrors}
            disabled={isSaving}
          />
        </CardText>
        <CardActions>
          {isSaving && <CircularProgress key="progress" id="progress" />}
          <Button
            flat
            key="cancelButton"
            children={t(CANCEL_BUTTON_LABEL)}
            onClick={this.onCancelEdit}
            disabled={isSaving}
          />
          <Button
            raised
            primary
            key="submitButton"
            type="submit"
            children={t(COUNTER_JUSTIFICATION_SUBMIT_BUTTON_LABEL)}
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
  id: PropTypes.string.isRequired,
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
