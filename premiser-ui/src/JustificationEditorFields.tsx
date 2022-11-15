import React from "react";
import { Divider, Subheader } from "react-md";
import get from "lodash/get";
import has from "lodash/has";
import map from "lodash/map";
import join from "lodash/join";

import {
  isWritQuoteBased,
  isPropositionCompoundBased,
  JustificationPolarities,
  JustificationBasisTypes,
  Justification,
  Url,
  PropositionCompoundAtom,
} from "howdju-common";

import t, {
  JUSTIFICATION_POLARITY_NEGATIVE,
  JUSTIFICATION_POLARITY_POSITIVE,
  JUSTIFICATION_BASIS_TYPE_PROPOSITION_COMPOUND,
  JUSTIFICATION_BASIS_TYPE_WRIT_QUOTE,
} from "./texts";
import WritQuoteEditorFields from "./WritQuoteEditorFields";
import PropositionCompoundEditorFields from "./PropositionCompoundEditorFields";
import SelectionControlGroup from "./SelectionControlGroup";
import { combineNames, combineIds, combineSuggestionsKeys } from "./viewModels";

import "./JustificationEditorFields.scss";
import {
  OnAddCallback,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  OnRemoveCallback,
  OnSubmitCallback,
} from "./types";

const polarityName = "polarity";
const propositionCompoundName = "basis.propositionCompound";
const writQuoteName = "basis.writQuote";
const polarityControls = [
  {
    value: JustificationPolarities.POSITIVE,
    label: t(JUSTIFICATION_POLARITY_POSITIVE),
    title: "Support the truth of the proposition",
  },
  {
    value: JustificationPolarities.NEGATIVE,
    label: t(JUSTIFICATION_POLARITY_NEGATIVE),
    title: "Oppose the truth of the proposition",
  },
];
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
        {t("Compound (deprecated)")}
      </div>
    ),
  },
];
type Props = {
  justification?: Justification;
  id: string;
  name?: string;
  suggestionsKey?: string;
  onPropertyChange: OnPropertyChangeCallback;
  onAddUrl: OnAddCallback;
  onRemoveUrl: OnRemoveCallback<Url>;
  onAddPropositionCompoundAtom: OnAddCallback;
  onRemovePropositionCompoundAtom: OnRemoveCallback<PropositionCompoundAtom>;
  disabled?: boolean;
  errors?: object;
  doShowTypeSelection?: boolean;
  onKeyDown?: OnKeyDownCallback;
  onSubmit: OnSubmitCallback;
};
export default function JustificationEditorFields(props: Props) {
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
  } = props;

  const onChange = toOnChangeCallback(onPropertyChage)
  const onChange = (value, event) => {
    const name = event.target.name;
    onPropertyChange({ [name]: value });
  };

  const propositionCompoundErrors = get(errors, "basis.propositionCompound");
  const writQuoteErrors = get(errors, "basis.writQuote");
  const basisPropositionCompound = get(justification, propositionCompoundName);
  const basisWritQuote = get(justification, writQuoteName);
  const _isPropositionCompoundBased = isPropositionCompoundBased(justification);
  const _isWritQuoteBased = isWritQuoteBased(justification);
  const commonFieldsProps = {
    onPropertyChange,
    onKeyDown,
    onSubmit,
    disabled,
  };
  const propositionCompoundEditorFields = (
    <PropositionCompoundEditorFields
      {...commonFieldsProps}
      propositionCompound={basisPropositionCompound}
      id={combineIds(id, propositionCompoundName)}
      key={propositionCompoundName}
      name={combineNames(name, propositionCompoundName)}
      suggestionsKey={combineSuggestionsKeys(
        suggestionsKey,
        propositionCompoundName
      )}
      errors={propositionCompoundErrors}
      onAddPropositionCompoundAtom={onAddPropositionCompoundAtom}
      onRemovePropositionCompoundAtom={onRemovePropositionCompoundAtom}
    />
  );
  const writQuoteEditorFields = (
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
  );
  const polarity = get(justification, "polarity");
  const basisTypeName = "basis.type";
  const basisType = get(justification, basisTypeName);
  return (
    <div>
      <SelectionControlGroup
        inline
        id={combineIds(id, polarityName)}
        name={combineNames(name, polarityName)}
        type="radio"
        value={polarity}
        onChange={onChange}
        controls={polarityControls}
        disabled={disabled}
        error={has(errors, polarityName)}
        errorText={join(
          map(get(errors, polarityName), (e) => e.message),
          ", "
        )}
      />
      <Divider />
      {doShowTypeSelection && (
        <>
          <Subheader primary primaryText="Type" component="div" />
          <SelectionControlGroup
            inline
            id={combineIds(id, basisTypeName)}
            name={combineNames(name, basisTypeName)}
            type="radio"
            value={basisType}
            onChange={onChange}
            controls={basisTypeControls}
            disabled={disabled}
          />
        </>
      )}

      <Divider />
      {_isPropositionCompoundBased && propositionCompoundEditorFields}
      {_isWritQuoteBased && writQuoteEditorFields}
    </div>
  );
}
