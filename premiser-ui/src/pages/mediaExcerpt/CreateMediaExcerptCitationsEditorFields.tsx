import React from "react";

import { CreateMediaExcerptCitationsInput } from "howdju-common";

import { EntityEditorFieldsProps } from "@/editors/withEditor";
import { combineIds, combineNames } from "@/viewModels";
import { MediaExcerptCitationsEditorFields } from "@/editors/MediaExcerptCitationsEditorFields";

interface Props
  extends EntityEditorFieldsProps<
    "editModel",
    CreateMediaExcerptCitationsInput
  > {}

/** Translates an edit entity into a wrapped UrlLocatorsEditorFields' citations. */
export default function CreateMediaExcerptCitationsEditorFields({
  id,
  name,
  disabled,
  onBlur,
  onPropertyChange,
  onSubmit,
  editModel,
  wasSubmitAttempted,
  suggestionsKey,
  errors,
  dirtyFields,
  blurredFields,
  editorDispatch,
}: Props) {
  if (!editModel) {
    return null;
  }
  const { citations } = editModel;

  return (
    <MediaExcerptCitationsEditorFields
      id={combineIds(id, `citations`)}
      key={combineIds(id, `citations`)}
      name={combineNames(name, `citations`)}
      citations={citations}
      errors={errors?.citations}
      dirtyFields={dirtyFields?.citations}
      blurredFields={blurredFields?.citations}
      editorDispatch={editorDispatch}
      disabled={disabled}
      suggestionsKey={suggestionsKey}
      onPropertyChange={onPropertyChange}
      wasSubmitAttempted={wasSubmitAttempted}
      onBlur={onBlur}
      onSubmit={onSubmit}
    />
  );
}
