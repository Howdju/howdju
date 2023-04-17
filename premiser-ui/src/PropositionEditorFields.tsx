import React from "react";

import SingleLineTextField from "./SingleLineTextField";
import PropositionTextAutocomplete from "./PropositionTextAutocomplete";
import { makeErrorPropCreator } from "./modelErrorMessages";
import ErrorMessages from "./ErrorMessages";
import { combineIds, combineNames, combineSuggestionsKeys } from "./viewModels";
import { CreatePropositionInput, UpdatePropositionInput } from "howdju-common";
import { OnKeyDownCallback } from "./types";
import { EntityEditorFieldsProps } from "./editors/withEditor";

const textName = "text";

interface Props
  extends EntityEditorFieldsProps<
    "proposition",
    CreatePropositionInput | UpdatePropositionInput
  > {
  onKeyDown?: OnKeyDownCallback;
  autoFocus?: boolean;
}

export default function PropositionEditorFields(props: Props) {
  const {
    id,
    proposition,
    suggestionsKey,
    name,
    disabled,
    onPropertyChange,
    errors,
    onKeyDown,
    onSubmit,
    wasSubmitAttempted,
    dirtyFields,
    blurredFields,
    autoFocus,
    // ignore
    editorDispatch,
    ...rest
  } = props;

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  const textErrorProps = errorProps((p) => p.text);
  const textProps = {
    id: combineIds(id, "text"),
    name: combineNames(name, textName),
    label: "Text",
    value: proposition?.text ?? "",
    required: true,
    autoFocus,
    onKeyDown,
    onSubmit,
    onPropertyChange,
    disabled: disabled,
    ...textErrorProps,
  };

  const textInput =
    suggestionsKey && !disabled ? (
      <PropositionTextAutocomplete
        {...rest}
        {...textProps}
        suggestionsKey={combineSuggestionsKeys(suggestionsKey, textName)}
      />
    ) : (
      <SingleLineTextField {...rest} {...textProps} />
    );
  return (
    <div>
      <ErrorMessages errors={errors?._errors} />
      {textInput}
    </div>
  );
}
