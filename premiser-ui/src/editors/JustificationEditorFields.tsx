import React from "react";
import { Text } from "@react-md/typography";

import {
  isWritQuoteBased,
  isPropositionCompoundBased,
  CreateJustificationInput,
  isRef,
  isMediaExcerptBased,
  isOnlyRef,
} from "howdju-common";

import { HorizontalRule } from "@/components/layout/HorizontalRule";
import { CircularProgress } from "@/components/progress/CircularProgress";
import WritQuoteEditorFields from "@/WritQuoteEditorFields";
import PropositionCompoundEditorFields from "@/PropositionCompoundEditorFields";
import { RadioGroup } from "@/components/input/RadioGroup";
import { combineNames, combineIds, combineSuggestionsKeys } from "@/viewModels";
import { OnKeyDownCallback } from "@/types";
import {
  EditorFieldsDispatch,
  EntityEditorFieldsProps,
} from "@/editors/withEditor";
import { makeErrorPropCreator } from "@/modelErrorMessages";
import { logger } from "@/logger";
import MediaExcerptEditorFields from "./MediaExcerptEditorFields";

import "./JustificationEditorFields.scss";

const polarityName = "polarity";
const propositionCompoundName = "basis.propositionCompound";
const mediaExcerptName = "basis.mediaExcerpt";
const writQuoteName = "basis.writQuote";
const polarityControls = [
  {
    value: "POSITIVE",
    label: <div title="Support the truth of the proposition">Positive</div>,
  },
  {
    value: "NEGATIVE",
    label: <div title="Oppose the truth of the proposition">Negative</div>,
  },
];
const basisTypeControls = [
  {
    value: "PROPOSITION_COMPOUND",
    label: (
      <div title="Proposition Compound: an argument based on an ordered list of propositions">
        Proposition(s)
      </div>
    ),
  },
  {
    value: "MEDIA_EXCERPT",
    label: (
      <div title="Media Excerpt: evidence based on an excerpt of an external media source">
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
      <RadioGroup
        inline
        id={combineIds(id, polarityName)}
        name={combineNames(name, polarityName)}
        value={polarity}
        onPropertyChange={onPropertyChange}
        radios={polarityControls}
        disabled={disabled}
        {...errorProps((i) => i.polarity)}
      />
      <HorizontalRule />
      {doShowTypeSelection && (
        <>
          <Text type="subtitle-1">Type</Text>
          <RadioGroup
            inline
            id={combineIds(id, basisTypeName)}
            name={combineNames(name, basisTypeName)}
            value={basisType}
            onPropertyChange={onPropertyChange}
            radios={basisTypeControls}
            disabled={disabled}
            {...errorProps((i) => i.basis.type)}
          />
        </>
      )}

      <HorizontalRule />
      {editorFields}
    </div>
  );
}
