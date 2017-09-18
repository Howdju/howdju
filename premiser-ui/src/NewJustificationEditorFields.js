import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Divider from 'react-md/lib/Dividers'
import SelectionControlGroup from 'react-md/lib/SelectionControls/SelectionControlGroup'
import Subheader from 'react-md/lib/Subheaders'
import get from 'lodash/get'

import {
  isWritQuoteBased,
  isStatementCompoundBased,
  isJustificationBasisCompoundBased,
  JustificationBasisType,
  JustificationPolarity
} from "howdju-common"
import t, {
  texts,
  JUSTIFICATION_BASIS_TYPE_WRIT_QUOTE,
  JUSTIFICATION_BASIS_TYPE_STATEMENT_COMPOUND,
  JUSTIFICATION_POLARITY_NEGATIVE,
  JUSTIFICATION_POLARITY_POSITIVE,
} from "./texts"
import WritQuoteEditorFields from "./WritQuoteEditorFields"
import StatementCompoundEditorFields from "./StatementCompoundEditorFields"
import JustificationBasisCompoundEditorFields from './JustificationBasisCompoundEditorFields'

import './NewJustificationEditorFields.scss'


const statementCompoundName = 'basis.statementCompound'
const writQuoteName = "basis.writQuote"
const justificationBasisCompoundName = 'basis.justificationBasisCompound'

const polarityControls = [{
  value: JustificationPolarity.POSITIVE,
  label: (
    <div title="Support the truth of the statement">
      {t(JUSTIFICATION_POLARITY_POSITIVE)}
    </div>
  ),
}, {
  value: JustificationPolarity.NEGATIVE,
  label: (
    <div title="Oppose the truth of the statement">
      {t(JUSTIFICATION_POLARITY_NEGATIVE)}
    </div>
  ),
}]
const basisTypeControls = [
  {
    value: JustificationBasisType.STATEMENT_COMPOUND,
    label: (
      <div title="A list of statements that when taken together logically imply the target">
        {t(JUSTIFICATION_BASIS_TYPE_STATEMENT_COMPOUND)}
      </div>
    ),
  },
  {
    value: JustificationBasisType.WRIT_QUOTE,
    label: (
      <div title="An external reference">
        {t(JUSTIFICATION_BASIS_TYPE_WRIT_QUOTE)}
      </div>
    ),
  },
  {
    value: JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
    label: (
      <div title="An external reference">
        {t(texts.JUSTIFICATION_BASIS_TYPE_JUSTIFICATION_BASIS_COMPOUND)}
      </div>
    ),
  },
]

class NewJustificationEditorFields extends Component {

  onChange = (value, event) => {
    const name = event.target.name
    this.props.onPropertyChange({[name]: value})
  }

  render() {
    const {
      newJustification,
      name,
      id,
      readOnlyBasis,
      disabled,
      suggestionsKey,
      onSubmit,
      onPropertyChange,
      onAddUrl,
      onRemoveUrl,
      onAddStatementCompoundAtom,
      onRemoveStatementCompoundAtom,
      onAddJustificationBasisCompoundAtom,
      onRemoveJustificationBasisCompoundAtom,
      errors,
      onKeyDown,
    } = this.props

    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    const justificationBasisCompoundErrors = errors && errors.fieldErrors.basis.fieldErrors.justificationBasisCompound
    const statementCompoundErrors = errors && errors.fieldErrors.basis.fieldErrors.statementCompound
    const writQuoteErrors = errors && errors.fieldErrors.basis.fieldErrors.writQuote

    const basisStatementCompound = get(newJustification, statementCompoundName)
    const basisWritQuote = get(newJustification, writQuoteName)
    const justificationBasisCompound = get(newJustification, justificationBasisCompoundName)
    const basisType = get(newJustification, 'basis.type')
    const _isStatementCompoundBased = isStatementCompoundBased(newJustification)
    const _isWritQuoteBased = isWritQuoteBased(newJustification)
    const _isJustificationBasisCompoundBased = isJustificationBasisCompoundBased(newJustification)

    const statementCompoundEditorFields = (
      <StatementCompoundEditorFields statementCompound={basisStatementCompound}
                                     key="statementEditorFields"
                                     id={idPrefix + statementCompoundName}
                                     name={namePrefix + statementCompoundName}
                                     suggestionsKey={suggestionsKeyPrefix + statementCompoundName}
                                     onPropertyChange={onPropertyChange}
                                     onAddStatementCompoundAtom={onAddStatementCompoundAtom}
                                     onRemoveStatementCompoundAtom={onRemoveStatementCompoundAtom}
                                     disabled={readOnlyBasis || disabled}
                                     onSubmit={onSubmit}
                                     errors={statementCompoundErrors}
                                     onKeyDown={onKeyDown}
      />
    )
    const writQuoteEditorFields =  (
      <WritQuoteEditorFields writQuote={basisWritQuote}
                             id={idPrefix + writQuoteName}
                             key={writQuoteName}
                             name={namePrefix + writQuoteName}
                             suggestionsKey={suggestionsKeyPrefix + writQuoteName}
                             onPropertyChange={onPropertyChange}
                             onAddUrl={onAddUrl}
                             onRemoveUrl={onRemoveUrl}
                             disabled={readOnlyBasis || disabled}
                             onSubmit={onSubmit}
                             errors={writQuoteErrors}
                             onKeyDown={onKeyDown}
      />
    )
    const justificationBasisCompoundEditorFields = (
      <JustificationBasisCompoundEditorFields justificationBasisCompound={justificationBasisCompound}
                                              id={idPrefix + justificationBasisCompoundName}
                                              name={namePrefix + justificationBasisCompoundName}
                                              suggestionsKey={suggestionsKeyPrefix + justificationBasisCompoundName}
                                              onPropertyChange={onPropertyChange}
                                              onAddJustificationBasisCompoundAtom={onAddJustificationBasisCompoundAtom}
                                              onRemoveJustificationBasisCompoundAtom={onRemoveJustificationBasisCompoundAtom}
                                              errors={justificationBasisCompoundErrors}
      />
    )

    const polarity = get(newJustification, 'polarity')

    return (
      <div>
        <SelectionControlGroup
          inline
          id={idPrefix + "polarity"}
          name={namePrefix + "polarity"}
          type="radio"
          value={polarity}
          onChange={this.onChange}
          controls={polarityControls}
          disabled={disabled}
        />
        <Divider />
        <Subheader primary
                   primaryText="Type"
                   component="div"
        />
        <SelectionControlGroup
          inline
          id={idPrefix + "basis.type"}
          name={namePrefix + "basis.type"}
          type="radio"
          value={basisType}
          onChange={this.onChange}
          controls={basisTypeControls}
          disabled={readOnlyBasis || disabled}
        />
        <Divider />
        {_isStatementCompoundBased && statementCompoundEditorFields}
        {_isWritQuoteBased && writQuoteEditorFields}
        {_isJustificationBasisCompoundBased && justificationBasisCompoundEditorFields}
      </div>
    )
  }
}
NewJustificationEditorFields.propTypes = {
  newJustification: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string.isRequired,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If present, this string will be prepended to this editor's autocomplete's suggestionKeys, with an intervening "." */
  suggestionsKey: PropTypes.string,
  onPropertyChange: PropTypes.func.isRequired,
  onRemoveUrl: PropTypes.func.isRequired,
  onAddUrl: PropTypes.func.isRequired,
  onAddStatementCompoundAtom: PropTypes.func.isRequired,
  onRemoveStatementCompoundAtom: PropTypes.func.isRequired,
  onAddJustificationBasisCompoundAtom: PropTypes.func.isRequired,
  onRemoveJustificationBasisCompoundAtom: PropTypes.func.isRequired,
  /** Disables the basis inputs, but the polarity is still active */
  readOnlyBasis: PropTypes.bool,
  disabled: PropTypes.bool,
  onSubmit: PropTypes.func,
  errors: PropTypes.object,
  /** Passed to subcontrols */
  onKeyDown: PropTypes.func,
}
NewJustificationEditorFields.defaultProps = {
  readOnlyBasis: false,
}

export default NewJustificationEditorFields