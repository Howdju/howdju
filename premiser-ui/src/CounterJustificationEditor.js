import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from "react-redux"
import Button from 'react-md/lib/Buttons/Button'
import CircularProgress from 'react-md/lib/Progress/CircularProgress'
import CardActions from 'react-md/lib/Cards/CardActions'
import CardText from 'react-md/lib/Cards/CardText'
import get from 'lodash/get'

import JustificationBasisCompoundEditorFields from "./JustificationBasisCompoundEditorFields"
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

  onAddJustificationBasisCompoundAtom = (index) => {
    this.props.editors.addJustificationBasisCompoundAtom(this.editorType, this.props.editorId, index)
  }

  onRemoveJustificationBasisCompoundAtom = (atom, index) => {
    this.props.editors.removeJustificationBasisCompoundAtom(this.editorType, this.props.editorId, atom, index)
  }

  onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl = (atomIndex, urlIndex) => {
    this.props.editors.addJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl(this.editorType, this.props.editorId, atomIndex, urlIndex)
  }

  onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl = (atom, atomIndex, url, urlIndex) => {
    this.props.editors.removeJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl(this.editorType, this.props.editorId, atom, atomIndex, url, urlIndex)
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
      ...rest,
    } = this.props
    delete rest.editors
    delete rest.editorId

    const justificationBasisCompoundErrors = get(errors, 'fieldErrors.basis.fieldErrors.justificationBasisCompound')
    const justificationBasisCompound = get(editEntity, 'basis.justificationBasisCompound')

    return (
      <form onSubmit={this.onSubmit}>
        <CardText>
          <JustificationBasisCompoundEditorFields
            justificationBasisCompound={justificationBasisCompound}
            id={id}
            name="basis.justificationBasisCompound"
            suggestionsKey={suggestionsKey}
            onPropertyChange={this.onPropertyChange}
            onAddJustificationBasisCompoundAtom={this.onAddJustificationBasisCompoundAtom}
            onRemoveJustificationBasisCompoundAtom={this.onRemoveJustificationBasisCompoundAtom}
            onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl={this.onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl}
            onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl={this.onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl}
            errors={justificationBasisCompoundErrors}
          />
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