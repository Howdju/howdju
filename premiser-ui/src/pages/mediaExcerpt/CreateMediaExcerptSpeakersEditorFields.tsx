import React from "react";

import { CreateMediaExcerptSpeakersInput } from "howdju-common";

import { EntityEditorFieldsProps } from "@/editors/withEditor";
import { combineIds, combineNames } from "@/viewModels";
import { MediaExcerptSpeakersEditorFields } from "@/editors/MediaExcerptSpeakersEditorFields";

interface Props
  extends EntityEditorFieldsProps<
    "editModel",
    CreateMediaExcerptSpeakersInput
  > {}

/** Translates an edit entity into a wrapped MediaExcerptSpeakersEditorFields' speakers. */
export default function CreateMediaExcerptSpeakersEditorFields({
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
  const { speakers } = editModel;

  return (
    <MediaExcerptSpeakersEditorFields
      id={combineIds(id, `speakers`)}
      key={combineIds(id, `speakers`)}
      name={combineNames(name, `speakers`)}
      speakers={speakers}
      errors={errors?.speakers}
      dirtyFields={dirtyFields?.speakers}
      blurredFields={blurredFields?.speakers}
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
