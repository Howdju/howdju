import React, { ChangeEvent } from "react";
import { CircularProgress, Divider, Subheader } from "react-md";

import {
  isWritQuoteBased,
  isPropositionCompoundBased,
  JustificationPolarities,
  JustificationBasisTypes,
  CreateJustificationInput,
  isRef,
  isMediaExcerptBased,
  isOnlyRef,
} from "howdju-common";

import t, {
  JUSTIFICATION_POLARITY_NEGATIVE,
  JUSTIFICATION_POLARITY_POSITIVE,
} from "@/texts";
import WritQuoteEditorFields from "@/WritQuoteEditorFields";
import PropositionCompoundEditorFields from "@/PropositionCompoundEditorFields";
import SelectionControlGroup from "@/SelectionControlGroup";
import { combineNames, combineIds, combineSuggestionsKeys } from "@/viewModels";

import { OnKeyDownCallback } from "@/types";
import { toOnChangeCallback } from "@/util";
import {
  EditorFieldsDispatch,
  EntityEditorFieldsProps,
} from "@/editors/withEditor";
import { makeErrorPropCreator } from "@/modelErrorMessages";
import { logger } from "@/logger";

import "./JustificationEditorFields.scss";
import MediaExcerptEditorFields from "./MediaExcerptEditorFields";

const polarityName = "polarity";
const propositionCompoundName = "basis.propositionCompound";
const mediaExcerptName = "basis.mediaExcerpt";
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
      <div title="An argument based on an ordered list of propositions">
        Proposition(s)
      </div>
    ),
  },
  {
    value: "MEDIA_EXCERPT",
    label: (
      <div title="Evidence based on an excerpt of an external media source">
        Media Excerpt
      </div>
    ),
  },
];
interface Props
  // Justifications are not editable, they can only be created.
  extends EntityEditorFieldsProps<"justification", CreateJustificationInput> {
  doShowTypeSelection?: boolean;
  onKeyDown?: OnKeyDownCallback;
  editorDispatch: EditorFieldsDispatch;
}
export default function JustificationEditorFields(props: Props) {
  const {
    justification,
    name,
    id,
    disabled,
    doShowTypeSelection = true,
    suggestionsKey,
    onBlur,
    onPropertyChange,
    editorDispatch,
    blurredFields,
    dirtyFields,
    errors,
    wasSubmitAttempted,
    onKeyDown,
    onSubmit,
  } = props;

  const onChange = toOnChangeCallback(onPropertyChange);

  const basisPropositionCompound = justification.basis.propositionCompound;
  const basisMediaExcerpt = justification.basis.mediaExcerpt;
  const basisWritQuote = justification.basis.writQuote;
  const _isPropositionCompoundBased =
    justification && isPropositionCompoundBased(justification);
  const _isMediaExcerptBased =
    justification && isMediaExcerptBased(justification);
  const _isWritQuoteBased = justification && isWritQuoteBased(justification);
  const commonFieldsProps = {
    onBlur,
    onKeyDown,
    onPropertyChange,
    onSubmit,
    disabled,
  };

  if (isRef(basisPropositionCompound)) {
    logger.error(
      "JustificationEditorFields does not support PropositionCompound refs yet."
    );
  }
  if (isRef(basisWritQuote)) {
    logger.error(
      "JustificationEditorFields does not support WritQuote refs yet."
    );
  }

  const propositionCompoundEditorFields = !isRef(basisPropositionCompound) && (
    <PropositionCompoundEditorFields
      {...commonFieldsProps}
      id={combineIds(id, propositionCompoundName)}
      name={combineNames(name, propositionCompoundName)}
      propositionCompound={basisPropositionCompound}
      key={propositionCompoundName}
      suggestionsKey={combineSuggestionsKeys(
        suggestionsKey,
        propositionCompoundName
      )}
      blurredFields={blurredFields?.basis?.propositionCompound}
      dirtyFields={dirtyFields?.basis?.propositionCompound}
      errors={errors?.basis?.propositionCompound}
      wasSubmitAttempted={wasSubmitAttempted}
      editorDispatch={editorDispatch}
    />
  );
  const mediaExcerptEditorFields = !isOnlyRef(basisMediaExcerpt) && (
    <MediaExcerptEditorFields
      {...commonFieldsProps}
      mediaExcerpt={basisMediaExcerpt}
      id={combineIds(id, mediaExcerptName)}
      key={mediaExcerptName}
      name={combineNames(name, mediaExcerptName)}
      suggestionsKey={combineSuggestionsKeys(suggestionsKey, mediaExcerptName)}
      blurredFields={blurredFields?.basis?.mediaExcerpt}
      dirtyFields={dirtyFields?.basis?.mediaExcerpt}
      errors={errors?.basis?.mediaExcerpt}
      wasSubmitAttempted={wasSubmitAttempted}
      editorDispatch={editorDispatch}
    />
  );
  const writQuoteEditorFields = !isRef(basisWritQuote) && (
    <WritQuoteEditorFields
      {...commonFieldsProps}
      writQuote={basisWritQuote}
      id={combineIds(id, writQuoteName)}
      key={writQuoteName}
      name={combineNames(name, writQuoteName)}
      suggestionsKey={combineSuggestionsKeys(suggestionsKey, writQuoteName)}
      blurredFields={blurredFields?.basis?.writQuote}
      dirtyFields={dirtyFields?.basis?.writQuote}
      errors={errors?.basis?.writQuote}
      wasSubmitAttempted={wasSubmitAttempted}
      editorDispatch={editorDispatch}
    />
  );
  const editorFields = _isPropositionCompoundBased ? (
    propositionCompoundEditorFields
  ) : _isMediaExcerptBased ? (
    mediaExcerptEditorFields
  ) : _isWritQuoteBased ? (
    writQuoteEditorFields
  ) : (
    <CircularProgress id="justification-editor-fields" />
  );
  const polarity = justification?.polarity;
  const basisTypeName = "basis.type";
  const basisType = justification?.basis.type;

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

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
            {...errorProps((i) => i.basis.type)}
          />
        </>
      )}

      <Divider />
      {editorFields}
    </div>
  );
}
