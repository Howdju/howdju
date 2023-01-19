import React from "react";

import SingleLineTextField from "./SingleLineTextField";
import PropositionTextAutocomplete from "./PropositionTextAutocomplete";
import { makeErrorPropCreator } from "./modelErrorMessages";
import ErrorMessages from "./ErrorMessages";
import { combineIds, combineNames, combineSuggestionsKeys } from "./viewModels";
import { CreatePropositionInput, ModelErrors } from "howdju-common";
import {
  ComponentId,
  ComponentName,
  OnEventCallback,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  SuggestionsKey,
} from "./types";
import { BlurredFields, DirtyFields } from "./reducers/editors";

const textName = "text";
interface Props {
  proposition: CreatePropositionInput;
  id: ComponentId;
  /** An optional override of the ID of the input for editing the Proposition text.  If absent, an ID will be auto generated based upon {@see id} */
  textId?: string;
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name: ComponentName;
  /** If omitted, no autocomplete */
  suggestionsKey: SuggestionsKey;
  onPropertyChange: OnPropertyChangeCallback;
  errors: ModelErrors<CreatePropositionInput> | undefined;
  disabled: boolean;
  onKeyDown?: OnKeyDownCallback;
  /** If present, overrides the default label for the proposition text input */
  textLabel?: string;
  onSubmit?: OnEventCallback;
  wasSubmitAttempted: boolean;
  dirtyFields: DirtyFields<CreatePropositionInput> | undefined;
  blurredFields: BlurredFields<CreatePropositionInput> | undefined;
}

export default function PropositionEditorFields(props: Props) {
  const {
    id,
    textId,
    proposition,
    suggestionsKey,
    name,
    textLabel = "Text",
    disabled,
    onPropertyChange,
    errors,
    onKeyDown,
    onSubmit,
    wasSubmitAttempted,
    dirtyFields,
    blurredFields,
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
    id: textId || combineIds(id, "text"),
    name: combineNames(name, textName),
    label: textLabel,
    value: proposition.text,
    required: true,
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
