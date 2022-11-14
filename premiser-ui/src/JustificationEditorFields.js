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
  JustificationPolarities,
  JustificationBasisTypes,
} from "howdju-common"

import t, {
  JUSTIFICATION_POLARITY_NEGATIVE,
  JUSTIFICATION_POLARITY_POSITIVE,
  JUSTIFICATION_BASIS_TYPE_PROPOSITION_COMPOUND,
  JUSTIFICATION_BASIS_TYPE_WRIT_QUOTE,
} from "./texts"
import WritQuoteEditorFields from "./WritQuoteEditorFields"
import PropositionCompoundEditorFields from "./PropositionCompoundEditorFields"
import SelectionControlGroup from './SelectionControlGroup'
import {
  combineNames,
  combineIds,
  combineSuggestionsKeys,
} from './viewModels'

import './JustificationEditorFields.scss'

const polarityName = 'polarity'
const propositionCompoundName = 'basis.propositionCompound'
const writQuoteName = "basis.writQuote"

const polarityControls = [{
  value: JustificationPolarities.POSITIVE,
  label: t(JUSTIFICATION_POLARITY_POSITIVE),
  title: "Support the truth of the proposition",
}, {
  value: JustificationPolarities.NEGATIVE,
  label: t(JUSTIFICATION_POLARITY_NEGATIVE),
  title: "Oppose the truth of the proposition",
}]
const basisTypeControls = [
  {
    value: JustificationBasisTypes.PROPOSITION_COMPOUND,
    label: (
      <div title="A list of propositions that together imply the target">
        {t(JUSTIFICATION_BASIS_TYPE_PROPOSITION_COMPOUND)}
      </div>
    ),
  },
  {
    value: JustificationBasisTypes.WRIT_QUOTE,
    label: (
      <div title="An external reference">
        {t(JUSTIFICATION_BASIS_TYPE_WRIT_QUOTE)}
      </div>
    ),
  },
  {
    value: JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND,
    label: (
      <div title="A list of justifications that together imply the target">
        {t('Compound (deprecated)')}
      </div>
    ),
  },
]

export default class JustificationEditorFields extends Component {
  static propTypes = {
    justification: PropTypes.object,
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
    disabled: PropTypes.bool,
    errors: PropTypes.object,
    /** Passed to subcontrols */
    onKeyDown: PropTypes.func,
  }

  static defaultProps = {
    doShowTypeSelection: true,
  }

  onChange = (value, event) => {
    const name = event.target.name
    this.props.onPropertyChange({[name]: value})
  }

  render() {
    const {
      justification,
      name,
      id,
      disabled,
      doShowTypeSelection,
      suggestionsKey,
      onPropertyChange,
      onAddUrl,
      onRemoveUrl,
      onAddPropositionCompoundAtom,
      onRemovePropositionCompoundAtom,
      errors,
      onKeyDown,
      onSubmit,
    } = this.props

    const propositionCompoundErrors = get(errors, 'basis.propositionCompound')
    const writQuoteErrors = get(errors, 'basis.writQuote')

    const basisPropositionCompound = get(justification, propositionCompoundName)
    const basisWritQuote = get(justification, writQuoteName)
    const _isPropositionCompoundBased = isPropositionCompoundBased(justification)
    const _isWritQuoteBased = isWritQuoteBased(justification)

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

    const polarity = get(justification, 'polarity')
    const basisTypeName = 'basis.type'
    const basisType = get(justification, basisTypeName)

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
        {doShowTypeSelection &&
          <React.Fragment>
            <Subheader
              primary
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
          </React.Fragment>
        }

        <Divider />
        {_isPropositionCompoundBased && propositionCompoundEditorFields}
        {_isWritQuoteBased && writQuoteEditorFields}
      </div>
    )
  }
}
