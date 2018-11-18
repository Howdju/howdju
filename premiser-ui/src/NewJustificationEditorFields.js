import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Divider, Subheader} from 'react-md'
import get from 'lodash/get'
import has from 'lodash/has'
import map from 'lodash/map'
import join from 'lodash/join'

import {
  isWritQuoteBased,
  isPropositionCompoundBased,
  isJustificationBasisCompoundBased,
  JustificationPolarity,
  JustificationBasisType,
} from "howdju-common"

import t, {
  JUSTIFICATION_POLARITY_NEGATIVE,
  JUSTIFICATION_POLARITY_POSITIVE,
  JUSTIFICATION_BASIS_TYPE_PROPOSITION_COMPOUND,
  JUSTIFICATION_BASIS_TYPE_WRIT_QUOTE,
} from "./texts"
import WritQuoteEditorFields from "./WritQuoteEditorFields"
import PropositionCompoundEditorFields from "./PropositionCompoundEditorFields"
import JustificationBasisCompoundEditorFields from './JustificationBasisCompoundEditorFields'
import SelectionControlGroup from './SelectionControlGroup'
import {
  combineNames,
  combineIds,
  combineSuggestionsKeys
} from './viewModels'

import './NewJustificationEditorFields.scss'

const polarityName = 'polarity'
const propositionCompoundName = 'basis.propositionCompound'
const writQuoteName = "basis.writQuote"
const justificationBasisCompoundName = 'basis.justificationBasisCompound'

const polarityControls = [{
  value: JustificationPolarity.POSITIVE,
  label: t(JUSTIFICATION_POLARITY_POSITIVE),
  title: "Support the truth of the proposition",
}, {
  value: JustificationPolarity.NEGATIVE,
  label: t(JUSTIFICATION_POLARITY_NEGATIVE),
  title: "Oppose the truth of the proposition",
}]
const basisTypeControls = [
  {
    value: JustificationBasisType.PROPOSITION_COMPOUND,
    label: (
      <div title="A list of propositions that together imply the target">
        {t(JUSTIFICATION_BASIS_TYPE_PROPOSITION_COMPOUND)}
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
      onAddPropositionCompoundAtom,
      onRemovePropositionCompoundAtom,
      onAddJustificationBasisCompoundAtom,
      onRemoveJustificationBasisCompoundAtom,
      onAddJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl,
      onRemoveJustificationBasisCompoundAtomSourceExcerptParaphraseWritQuoteUrl,
      errors,
      onKeyDown,
      onSubmit,
    } = this.props

    const justificationBasisCompoundErrors = get(errors, 'basis.justificationBasisCompound')
    const propositionCompoundErrors = get(errors, 'basis.propositionCompound')
    const writQuoteErrors = get(errors, 'basis.writQuote')

    const basisPropositionCompound = get(newJustification, propositionCompoundName)
    const basisWritQuote = get(newJustification, writQuoteName)
    const justificationBasisCompound = get(newJustification, justificationBasisCompoundName)
    const _isPropositionCompoundBased = isPropositionCompoundBased(newJustification)
    const _isWritQuoteBased = isWritQuoteBased(newJustification)
    const _isJustificationBasisCompoundBased = isJustificationBasisCompoundBased(newJustification)

    const commonFieldsProps = {
      onPropertyChange,
      onKeyDown,
      onSubmit,
      disabled,
    }
    const propositionCompoundEditorFields = (
      <PropositionCompoundEditorFields
        {...commonFieldsProps}
        propositionCompound={basisPropositionCompound}
        id={combineIds(id, propositionCompoundName)}
        key={propositionCompoundName}
        name={combineNames(name, propositionCompoundName)}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, propositionCompoundName)}
        errors={propositionCompoundErrors}
        onAddPropositionCompoundAtom={onAddPropositionCompoundAtom}
        onRemovePropositionCompoundAtom={onRemovePropositionCompoundAtom}
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
          id={combineIds(id, polarityName)}
          name={combineNames(name, polarityName)}
          type="radio"
          value={polarity}
          onChange={this.onChange}
          controls={polarityControls}
          disabled={disabled}
          error={has(errors, polarityName)}
          errorText={join(map(get(errors, polarityName), e => e.message), ', ')}
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
        {_isPropositionCompoundBased && propositionCompoundEditorFields}
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
  onAddPropositionCompoundAtom: PropTypes.func.isRequired,
  onRemovePropositionCompoundAtom: PropTypes.func.isRequired,
  onAddJustificationBasisCompoundAtom: PropTypes.func.isRequired,
  onRemoveJustificationBasisCompoundAtom: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  errors: PropTypes.object,
  /** Passed to subcontrols */
  onKeyDown: PropTypes.func,
}
