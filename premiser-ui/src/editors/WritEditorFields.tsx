import React from "react";

import { UpdateWritInput, Writ, CreateWritInput } from "howdju-common";

import WritTitleAutocomplete from "@/WritTitleAutocomplete";
import ErrorMessages from "@/ErrorMessages";
import SingleLineTextField from "@/SingleLineTextField";
import { combineIds, combineNames, combineSuggestionsKeys } from "@/viewModels";
import { OnKeyDownCallback } from "@/types";
import { EditorFieldsDispatch, EntityEditorFieldsProps } from "./withEditor";
import { makeErrorPropCreator } from "../modelErrorMessages";

interface Props
  extends EntityEditorFieldsProps<"writ", CreateWritInput | UpdateWritInput> {
  onKeyDown?: OnKeyDownCallback;
  editorDispatch: EditorFieldsDispatch;
}

export default function WritEditorFields(props: Props) {
  const {
    writ,
    name,
    id,
    suggestionsKey,
    disabled,
    errors,
    onKeyDown,
    onSubmit,
    onBlur,
    onPropertyChange,
    dirtyFields,
    blurredFields,
    wasSubmitAttempted,
  } = props;

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  const writTitleInputErrorProps = errorProps((wq) => wq.title);

  const writTitle = writ?.title ?? "";

  const writTitleInputProps = {
    id: combineIds(id, "title"),
    name: combineNames(name, "title"),
    label: "Title",
    value: writTitle,
    minLength: Writ.shape.title.minLength,
    maxLength: Writ.shape.title.maxLength,
    required: true,
    disabled: disabled,
    onBlur,
    onKeyDown,
    onPropertyChange,
    onSubmit,
  };

  const combinedSuggestionKeys = combineSuggestionsKeys(
    suggestionsKey,
    "title"
  );

  return (
    <div className="writ-editor-fields">
      {suggestionsKey && !disabled ? (
        <WritTitleAutocomplete
          {...writTitleInputProps}
          {...writTitleInputErrorProps}
          suggestionsKey={combinedSuggestionKeys}
        />
      ) : (
        <SingleLineTextField
          {...writTitleInputProps}
          {...writTitleInputErrorProps}
        />
      )}
      <ErrorMessages errors={errors?._errors} />
    </div>
  );
}
