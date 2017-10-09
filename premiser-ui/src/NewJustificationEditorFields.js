import React, {Component} from 'react'
import PropTypes from 'prop-types'
import Divider from 'react-md/lib/Dividers'
import Subheader from 'react-md/lib/Subheaders/Subheader'
import SelectionControlGroup from 'react-md/lib/SelectionControls/SelectionControlGroup'
import get from 'lodash/get'

import {
  isWritQuoteBased,
  isStatementCompoundBased,
  isJustificationBasisCompoundBased,
  JustificationPolarity,
  JustificationBasisType,
} from "howdju-common"

import t, {
  JUSTIFICATION_POLARITY_NEGATIVE,
  JUSTIFICATION_POLARITY_POSITIVE,
  JUSTIFICATION_BASIS_TYPE_STATEMENT_COMPOUND,
  JUSTIFICATION_BASIS_TYPE_WRIT_QUOTE,
} from "./texts"
import WritQuoteEditorFields from "./WritQuoteEditorFields"
import StatementCompoundEditorFields from "./StatementCompoundEditorFields"
import JustificationBasisCompoundEditorFields from './JustificationBasisCompoundEditorFields'
import {
  combineNames,
  combineIds,
  combineSuggestionsKeys
} from './viewModels'

import './NewJustificationEditorFields.scss'


const statementCompoundName = 'basis.statementCompound'
const writQuoteName = "basis.writQuote"
const justificationBasisCompoundName = 'basis.justificationBasisCompound'

const polarityControls = [{
  value: JustificationPolarity.POSITIVE,
  label: t(JUSTIFICATION_POLARITY_POSITIVE),
  title: "Support the truth of the statement",
}, {
  value: JustificationPolarity.NEGATIVE,
  label: t(JUSTIFICATION_POLARITY_NEGATIVE),
  title: "Oppose the truth of the statement",
}]
const basisTypeControls = [
  {
    value: JustificationBasisType.STATEMENT_COMPOUND,
    label: (
      <div title="A list of statements that together imply the target">
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
      <div title="A list of justifications that together imply the target">
        {t('Compound (deprecated)')}
      </div>
    ),
  },
]

export default class NewJustificationEditorFields extends Component {

  onChange = (value, event) => {
    const name = event.target.name
    this.props.onPropertyChange({[name]: value})
  }

  render() {
    const {
      newJustification,
      name,
      id,
      disabled,
      suggestionsKey,
      onPropertyChange,
      onAddUrl,
      onRemoveUrl,
      onAddStatementCompoundAtom,
      onRemoveStatementCompoundAtom,
      onAddJustificationBasisCompoundAtom,
      onRemoveJustificationBasisCompoundAtom,
      onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl,
      onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl,
      errors,
      onKeyDown,
      onSubmit,
    } = this.props

    const justificationBasisCompoundErrors = errors && errors.fieldErrors.basis.fieldErrors.justificationBasisCompound
    const statementCompoundErrors = errors && errors.fieldErrors.basis.fieldErrors.statementCompound
    const writQuoteErrors = errors && errors.fieldErrors.basis.fieldErrors.writQuote

    const basisStatementCompound = get(newJustification, statementCompoundName)
    const basisWritQuote = get(newJustification, writQuoteName)
    const justificationBasisCompound = get(newJustification, justificationBasisCompoundName)
    const _isStatementCompoundBased = isStatementCompoundBased(newJustification)
    const _isWritQuoteBased = isWritQuoteBased(newJustification)
    const _isJustificationBasisCompoundBased = isJustificationBasisCompoundBased(newJustification)

    const commonFieldsProps = {
      onPropertyChange,
      onKeyDown,
      onSubmit,
      disabled,
    }
    const statementCompoundEditorFields = (
      <StatementCompoundEditorFields
        {...commonFieldsProps}
        statementCompound={basisStatementCompound}
        id={combineIds(id, statementCompoundName)}
        key={statementCompoundName}
        name={combineNames(name, statementCompoundName)}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, statementCompoundName)}
        errors={statementCompoundErrors}
        onAddStatementCompoundAtom={onAddStatementCompoundAtom}
        onRemoveStatementCompoundAtom={onRemoveStatementCompoundAtom}
      />
    )
    const writQuoteEditorFields =  (
      <WritQuoteEditorFields
        {...commonFieldsProps}
        writQuote={basisWritQuote}
        id={combineIds(id, writQuoteName)}
        key={writQuoteName}
        name={combineNames(name, writQuoteName)}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, writQuoteName)}
        errors={writQuoteErrors}
        onAddUrl={onAddUrl}
        onRemoveUrl={onRemoveUrl}
      />
    )
    const justificationBasisCompoundEditorFields = [
      <h2 className="justification-basis-compound-editor-fields-header"
          key="justification-basis-compound-editor-fields-header">
        Clauses
      </h2>,
      <JustificationBasisCompoundEditorFields
        {...commonFieldsProps}
        justificationBasisCompound={justificationBasisCompound}
        key="justification-basis-compound-editor-fields"
        id={combineIds(id, justificationBasisCompoundName)}
        name={combineNames(name, justificationBasisCompoundName)}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, justificationBasisCompoundName)}
        errors={justificationBasisCompoundErrors}
        onAddJustificationBasisCompoundAtom={onAddJustificationBasisCompoundAtom}
        onRemoveJustificationBasisCompoundAtom={onRemoveJustificationBasisCompoundAtom}
        onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl={onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl}
        onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl={onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl}
      />
    ]

    const polarity = get(newJustification, 'polarity')
    const basisTypeName = 'basis.type'
    const basisType = get(newJustification, basisTypeName)

    return (
      <div>
        <SelectionControlGroup
          inline
          id={combineIds(id, "polarity")}
          name={combineNames(name, "polarity")}
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
          id={combineIds(id, basisTypeName)}
          name={combineNames(name, basisTypeName)}
          type="radio"
          value={basisType}
          onChange={this.onChange}
          controls={basisTypeControls}
          disabled={disabled}
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
  disabled: PropTypes.bool,
  errors: PropTypes.object,
  /** Passed to subcontrols */
  onKeyDown: PropTypes.func,
}
