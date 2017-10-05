import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import Button from 'react-md/lib/Buttons/Button'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import get from 'lodash/get'

import {
  makeNewJustification
} from "howdju-common"

import {
  editors,
  mapActionCreatorGroupToDispatchToProps,
} from './actions'
import {EditorTypes} from "./reducers/editors"
import t, {
  CANCEL_BUTTON_LABEL,
  EDIT_STATEMENT_SUBMIT_BUTTON_LABEL
} from "./texts"
import {
  translateNewJustificationErrors
} from './viewModels'
import NewJustificationEditorFields from "./NewJustificationEditorFields"


class NewJustificationEditor extends Component {

  onPropertyChange = (properties) => {
    this.props.editors.propertyChange(NewJustificationEditor.editorType, this.props.editorId, properties)
  }

  onAddUrl = () => {
    this.props.editors.addUrl(NewJustificationEditor.editorType, this.props.editorId)
  }

  onRemoveUrl = (url, index) => {
    this.props.editors.removeUrl(NewJustificationEditor.editorType, this.props.editorId, url, index)
  }

  onAddStatementCompoundAtom = () => {
    this.props.editors.addStatementCompoundAtom(NewJustificationEditor.editorType, this.props.editorId)
  }

  onRemoveStatementCompoundAtom = (atom, index) => {
    this.props.editors.removeStatementCompoundAtom(NewJustificationEditor.editorType, this.props.editorId, atom, index)
  }

  addJustificationBasisCompoundAtom = (index) => {
    this.props.editors.addJustificationBasisCompoundAtom(NewJustificationEditor.editorType, this.props.editorId, index)
  }

  removeJustificationBasisCompoundAtom = (atom, index) => {
    this.props.editors.removeJustificationBasisCompoundAtom(NewJustificationEditor.editorType,
      this.props.editorId, atom, index)
  }

  onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl = (atomIndex, urlIndex) => {
    this.props.editors.addJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl(this.editorType,
      this.editorId, atomIndex, urlIndex)
  }

  onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl = (atom, atomIndex, url, urlIndex) => {
    this.props.editors.removeJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl(this.editorType,
      this.editorId, atom, atomIndex, url, urlIndex)
  }

  onSubmit = (event) => {
    if (!this.props.onSubmit) {
      event.preventDefault()
      this.props.editors.commitEdit(NewJustificationEditor.editorType, this.props.editorId)
    } else {
      this.props.onSubmit(event)
    }
  }

  onCancelEdit = () => {
    this.props.editors.cancelEdit(NewJustificationEditor.editorType, this.props.editorId)
  }

  render() {
    const {
      id,
      suggestionsKey,
      editorState,
      doShowButtons,
      disabled,
      onKeyDown,
      ...rest
    } = this.props
    delete rest.editors
    delete rest.editorId
    delete rest.onSubmit

    const newJustification = editorState.editEntity || makeNewJustification()
    const {errors, isSaving} = editorState
    const newJustificationErrors = translateNewJustificationErrors(newJustification, errors)

    const buttons = [
      <Button flat
              key="cancelButton"
              label={t(CANCEL_BUTTON_LABEL)}
              onClick={this.onCancelEdit} />,
      <Button flat
              primary
              key="submitButton"
              type="submit"
              label={t(EDIT_STATEMENT_SUBMIT_BUTTON_LABEL)}
              disabled={isSaving}
      />
    ]

    const idPrefix = id ? id + '.' : ''
    return (
      <form onSubmit={this.onSubmit}>
        <NewJustificationEditorFields
          {...rest}
          newJustification={newJustification}
          id={idPrefix + 'editor'}
          onPropertyChange={this.onPropertyChange}
          onAddUrl={this.onAddUrl}
          onRemoveUrl={this.onRemoveUrl}
          onAddStatementCompoundAtom={this.onAddStatementCompoundAtom}
          onRemoveStatementCompoundAtom={this.onRemoveStatementCompoundAtom}
          onAddJustificationBasisCompoundAtom={this.addJustificationBasisCompoundAtom}
          onRemoveJustificationBasisCompoundAtom={this.removeJustificationBasisCompoundAtom}
          onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl={this.onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl}
          onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl={this.onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl}
          onSubmit={this.onSubmit}
          suggestionsKey={suggestionsKey}
          errors={newJustificationErrors}
          disabled={disabled}
          onKeyDown={onKeyDown}
        />
        {isSaving && <CircularProgress key="progress" id="progress" />}
        {doShowButtons && buttons}
      </form>
    )
  }
}
NewJustificationEditor.propTypes = {
  /** Identifies the editor's state */
  editorId: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  /** If omitted, no autocomplete */
  suggestionsKey: PropTypes.string,
  /** If present, defers submits to this function */
  onSubmit: PropTypes.func,
  doShowButtons: PropTypes.bool,
  disabled: PropTypes.bool,
  onKeyDown: PropTypes.func,
}
NewJustificationEditor.defaultProps = {
  doShowButtons: true
}
NewJustificationEditor.editorType = EditorTypes.NEW_JUSTIFICATION

const mapStateToProps = (state, ownProps) => {
  const editorState = get(state.editors, [EditorTypes.NEW_JUSTIFICATION, ownProps.editorId]) || {}
  return {
    editorState,
  }
}

export default connect(mapStateToProps, mapActionCreatorGroupToDispatchToProps({
  editors,
}))(NewJustificationEditor)