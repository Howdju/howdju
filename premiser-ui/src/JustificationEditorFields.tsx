import React, { ChangeEvent } from "react";
import { CircularProgress, Divider, Subheader } from "react-md";
import get from "lodash/get";

import {
  isWritQuoteBased,
  isPropositionCompoundBased,
  JustificationPolarities,
  JustificationBasisTypes,
  Url,
  PropositionCompoundAtom,
  CreateJustificationInput,
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
import { OnAddCallback, OnKeyDownCallback, OnRemoveCallback } from "./types";
import { toOnChangeCallback } from "./util";
import { EntityEditorFieldsProps } from "./editors/withEditor";
import { makeErrorPropCreator } from "./modelErrorMessages";

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
interface Props extends EntityEditorFieldsProps<CreateJustificationInput> {
  // Justifications are not editable, they can only be created.
  justification?: CreateJustificationInput;
  onAddUrl: OnAddCallback;
  onRemoveUrl: OnRemoveCallback<Url>;
  onAddPropositionCompoundAtom: OnAddCallback;
  onRemovePropositionCompoundAtom: OnRemoveCallback<PropositionCompoundAtom>;
  doShowTypeSelection?: boolean;
  onKeyDown?: OnKeyDownCallback;
}
export default function JustificationEditorFields(props: Props) {
  const {
    justification,
    name,
    id,
    disabled,
    doShowTypeSelection = true,
    suggestionsKey,
    onPropertyChange,
    onAddUrl,
    onRemoveUrl,
    onAddPropositionCompoundAtom,
    onRemovePropositionCompoundAtom,
    errors,
    onKeyDown,
    onSubmit,
    dirtyFields,
    blurredFields,
    wasSubmitAttempted,
  } = props;

  const onChange = toOnChangeCallback(onPropertyChange);

  const propositionCompoundErrors = get(errors, "basis.propositionCompound");
  const writQuoteErrors = get(errors, "basis.writQuote");
  const basisPropositionCompound = get(justification, propositionCompoundName);
  const basisWritQuote = get(justification, writQuoteName);
  const _isPropositionCompoundBased =
    justification && isPropositionCompoundBased(justification);
  const _isWritQuoteBased = justification && isWritQuoteBased(justification);
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
      dirtyFields={dirtyFields?.basis?.propositionCompound}
      blurredFields={blurredFields?.basis?.propositionCompound}
      wasSubmitAttempted={wasSubmitAttempted}
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
      wasSubmitAttempted={wasSubmitAttempted}
      dirtyFields={dirtyFields?.basis?.writQuote}
      blurredFields={dirtyFields?.basis?.writQuote}
    />
  );
  const editorFields = _isPropositionCompoundBased ? (
    propositionCompoundEditorFields
  ) : _isWritQuoteBased ? (
    writQuoteEditorFields
  ) : (
    <CircularProgress id="justification-editor-fields" />
  );
  const polarity = get(justification, "polarity");
  const basisTypeName = "basis.type";
  const basisType = get(justification, basisTypeName);

  const errorProps = makeErrorPropCreator(errors, dirtyFields, blurredFields);

  return (
    <div>
      <SelectionControlGroup
        inline
        id={combineIds(id, polarityName)}
        name={combineNames(name, polarityName)}
        type="radio"
        value={polarity}
        onChange={(value, event) =>
          onChange(value, event as unknown as ChangeEvent<HTMLInputElement>)
        }
        controls={polarityControls}
        disabled={disabled}
        {...errorProps((i) => i.polarity)}
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
            onChange={(value, event) =>
              onChange(value, event as unknown as ChangeEvent<HTMLInputElement>)
            }
            controls={basisTypeControls}
            disabled={disabled}
          />
        </>
      )}

      <Divider />
      {editorFields}
    </div>
  );
}
