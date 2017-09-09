import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Divider from 'react-md/lib/Dividers'
import SelectionControlGroup from 'react-md/lib/SelectionControls/SelectionControlGroup'
import Subheader from 'react-md/lib/Subheaders'
import get from 'lodash/get'

import {
  isWritingQuoteBased,
  isStatementCompoundBased,
  JustificationBasisType,
  JustificationPolarity
} from "howdju-common"
import t, {
  JUSTIFICATION_BASIS_TYPE_WRITING_QUOTE,
  JUSTIFICATION_BASIS_TYPE_STATEMENT_COMPOUND,
  JUSTIFICATION_POLARITY_NEGATIVE,
  JUSTIFICATION_POLARITY_POSITIVE,
} from "./texts"
import WritingQuoteEditorFields from "./WritingQuoteEditorFields"
import StatementCompoundEditorFields from "./StatementCompoundEditorFields"

import './NewJustificationEditorFields.scss'


const statementCompoundName = 'basis.statementCompound'
const writingQuoteName = "basis.writingQuote"

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
const basisTypeControls = [{
  value: JustificationBasisType.STATEMENT_COMPOUND,
  label: (
    <div title="A list of statements that when taken together logically imply the target">
      {t(JUSTIFICATION_BASIS_TYPE_STATEMENT_COMPOUND)}
    </div>
  ),
}, {
  value: JustificationBasisType.WRITING_QUOTE,
  label: (
    <div title="An external reference">
      {t(JUSTIFICATION_BASIS_TYPE_WRITING_QUOTE)}
    </div>
  ),
}]

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
      basisStatementTextId,
      basisWritingQuoteTextId,
      readOnlyBasis,
      disabled,
      suggestionsKey,
      onSubmit,
      onPropertyChange,
      onAddUrl,
      onRemoveUrl,
      onAddStatementAtom,
      onRemoveStatementAtom,
      errors,
      onKeyDown,
    } = this.props

    const namePrefix = name ? name + '.' : ''
    const idPrefix = id ? id + '.' : ''
    const suggestionsKeyPrefix = suggestionsKey ? suggestionsKey + '.' : ''

    const statementErrors = errors && errors.fieldErrors.basis.fieldErrors.statement
    const writingQuoteErrors = errors && errors.fieldErrors.basis.fieldErrors.writingQuote

    const basisStatementCompound = get(newJustification, statementCompoundName)
    const basisWritingQuote = get(newJustification, writingQuoteName)
    const basisType = get(newJustification, 'basis.type')
    const _isStatementCompoundBased = isStatementCompoundBased(newJustification)
    const _isWritingQuoteBased = isWritingQuoteBased(newJustification)

    const statementCompoundComponents = [
      <StatementCompoundEditorFields statementCompound={basisStatementCompound}
                                     key="statementEditorFields"
                                     textId={basisStatementTextId}
                                     name={namePrefix + statementCompoundName}
                                     suggestionsKey={suggestionsKeyPrefix + statementCompoundName}
                                     onPropertyChange={onPropertyChange}
                                     onAddStatementAtom={onAddStatementAtom}
                                     onRemoveStatementAtom={onRemoveStatementAtom}
                                     disabled={readOnlyBasis || disabled}
                                     onSubmit={onSubmit}
                                     errors={statementErrors}
                                     onKeyDown={onKeyDown}
      />
    ]
    const writingQuoteComponents =  [
      <WritingQuoteEditorFields writingQuote={basisWritingQuote}
                                     id={idPrefix + writingQuoteName}
                                     quoteTextId={basisWritingQuoteTextId}
                                     key={writingQuoteName}
                                     name={namePrefix + writingQuoteName}
                                     suggestionsKey={suggestionsKeyPrefix + writingQuoteName}
                                     onPropertyChange={onPropertyChange}
                                     onAddUrl={onAddUrl}
                                     onRemoveUrl={onRemoveUrl}
                                     disabled={readOnlyBasis || disabled}
                                     onSubmit={onSubmit}
                                     errors={writingQuoteErrors}
                                     onKeyDown={onKeyDown}
      />
    ]

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
        {_isStatementCompoundBased && statementCompoundComponents}
        {_isWritingQuoteBased && writingQuoteComponents}
      </div>
    )
  }
}
NewJustificationEditorFields.propTypes = {
  newJustification: PropTypes.object,
  /** If present, this string will be prepended to this editor's controls' ids, with an intervening "." */
  id: PropTypes.string,
  basisStatementTextId: PropTypes.string.isRequired,
  basisWritingQuoteTextId: PropTypes.string,
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: PropTypes.string,
  /** If present, this string will be prepended to this editor's autocomplete's suggestionKeys, with an intervening "." */
  suggestionsKey: PropTypes.string,
  onPropertyChange: PropTypes.func.isRequired,
  onRemoveUrl: PropTypes.func.isRequired,
  onAddUrl: PropTypes.func.isRequired,
  onAddStatementAtom: PropTypes.func.isRequired,
  onRemoveStatementAtom: PropTypes.func.isRequired,
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