import React from "react";

import PropositionCompoundEditorFields from "../PropositionCompoundEditorFields";
import {
  CreateCounterJustificationInput,
  isRef,
  PropositionCompound,
} from "howdju-common";
import {
  combineIds,
  combineNames,
  combineSuggestionsKeys,
} from "../viewModels";
import { EntityEditorFieldsProps } from "./withEditor";

const propositionCompoundName = "basis.propositionCompound";

interface Props
  extends EntityEditorFieldsProps<CreateCounterJustificationInput> {
  // Justifications are not editable, they can only be created.
  justification?: CreateCounterJustificationInput;
}

export default function CounterJustificationEditorFields(props: Props) {
  const {
    justification,
    name,
    id,
    disabled,
    suggestionsKey,
    editorDispatch,
    blurredFields,
    dirtyFields,
    errors,
    wasSubmitAttempted,
  } = props;

  const propositionCompound = justification?.basis.propositionCompound;

  if (!propositionCompound || isRef<PropositionCompound>(propositionCompound)) {
    return null;
  }

  return (
    <PropositionCompoundEditorFields
      {...props}
      propositionCompound={propositionCompound}
      id={combineIds(id, propositionCompoundName)}
      key={propositionCompoundName}
      name={combineNames(name, propositionCompoundName)}
      suggestionsKey={combineSuggestionsKeys(
        suggestionsKey,
        propositionCompoundName
      )}
      blurredFields={blurredFields?.basis?.propositionCompound}
      dirtyFields={dirtyFields?.basis?.propositionCompound}
      errors={errors?.basis?.propositionCompound}
      editorDispatch={editorDispatch}
      wasSubmitAttempted={wasSubmitAttempted}
      disabled={disabled}
    />
  );
}
