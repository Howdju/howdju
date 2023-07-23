import React from "react";

import { CreateUrlLocatorsInput } from "howdju-common";

import { EditorFieldsDispatch, EntityEditorFieldsProps } from "./withEditor";
import { combineIds, combineNames } from "@/viewModels";
import UrlLocatorsEditorFields from "./UrlLocatorsEditorFields";
import { EditorType } from "@/reducers/editors";
import { EditorId } from "@/types";
import { editors } from "@/actions";

interface Props
  extends EntityEditorFieldsProps<"editModel", CreateUrlLocatorsInput> {
  editorDispatch: EditorFieldsDispatch;
  /**
   * An optional callback for when the user clicks the infer MediaExcerpt into button.
   *
   * If missing, the button is not shown.
   */
  onInferMediaExcerptInfo?: (url: string) => void;
  /** The max number of UrlLocators to allow. */
  maxUrlLocatorCount?: number;
}

/** Wraps UrlLocatorsEditorFields and adds a mediaExcerptId */
export default function CreateUrlLocatorsEditorFields({
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
  maxUrlLocatorCount = 1,
}: Props) {
  if (!editModel) {
    return null;
  }
  const { urlLocators } = editModel;

  function onInferMediaExcerptInfo(url: string) {
    editorDispatch((editorType: EditorType, editorId: EditorId) =>
      editors.inferMediaExcerptInfo(editorType, editorId, url)
    );
  }
  return (
    <div>
      <UrlLocatorsEditorFields
        id={combineIds(id, `urlLocators`)}
        key={combineIds(id, `urlLocators`)}
        name={combineNames(name, `urlLocators`)}
        urlLocators={urlLocators}
        errors={errors?.urlLocators}
        dirtyFields={dirtyFields?.urlLocators}
        blurredFields={blurredFields?.urlLocators}
        editorDispatch={editorDispatch}
        disabled={disabled}
        suggestionsKey={suggestionsKey}
        onPropertyChange={onPropertyChange}
        wasSubmitAttempted={wasSubmitAttempted}
        onInferMediaExcerptInfo={onInferMediaExcerptInfo}
        maxUrlLocatorCount={maxUrlLocatorCount}
        onBlur={onBlur}
        onSubmit={onSubmit}
      />
    </div>
  );
}
