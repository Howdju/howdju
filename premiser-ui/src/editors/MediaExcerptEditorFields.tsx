import React from "react";

import {
  CreateMediaExcerptInput,
  extractQuotationFromTextFragment,
  MediaExcerpt,
} from "howdju-common";

import { combineNames, combineIds } from "@/viewModels";
import {
  EditorFieldsDispatch,
  EntityEditorFieldsProps,
} from "@/editors/withEditor";
import { makeErrorPropCreator } from "@/modelErrorMessages";
import { TextArea } from "@/components/text/TextArea";
import { EditorType } from "@/reducers/editors";
import { editors } from "@/actions";
import { EditorId } from "@/types";
import UrlLocatorsEditorFields from "./UrlLocatorsEditorFields";

import "./MediaExcerptEditorFields.scss";
import { MediaExcerptCitationsEditorFields } from "./MediaExcerptCitationsEditorFields";
import { MediaExcerptSpeakersEditorFields } from "./MediaExcerptSpeakersEditorFields";

interface Props
  extends EntityEditorFieldsProps<"mediaExcerpt", CreateMediaExcerptInput> {
  editorDispatch: EditorFieldsDispatch;
}
export default function MediaExcerptEditorFields(props: Props) {
  const {
    mediaExcerpt,
    name,
    id,
    disabled,
    suggestionsKey,
    onBlur,
    onPropertyChange,
    editorDispatch,
    blurredFields,
    dirtyFields,
    errors,
    wasSubmitAttempted,
    onSubmit,
  } = props;

  const errorProps = makeErrorPropCreator(
    wasSubmitAttempted,
    errors,
    dirtyFields,
    blurredFields
  );

  function onInferMediaExcerptInfo(url: string, index: number) {
    const quotation = mediaExcerpt?.localRep?.quotation;
    let inferredQuotation: string | undefined;
    if (!quotation) {
      inferredQuotation = extractQuotationFromTextFragment(url);
      if (inferredQuotation) {
        const quotationName = combineNames(name, "localRep.quotation");
        editorDispatch((editorType: EditorType, editorId: EditorId) =>
          editors.propertyChange(editorType, editorId, {
            [quotationName]: inferredQuotation,
          })
        );
      }
    }
    editorDispatch((editorType: EditorType, editorId: EditorId) =>
      editors.inferMediaExcerptInfo(
        editorType,
        editorId,
        url,
        index,
        quotation || inferredQuotation
      )
    );
  }

  return (
    <div className="media-excerpt-editor-fields">
      <TextArea
        id={combineIds(id, "localRep.quotation")}
        name={combineNames(name, "localRep.quotation")}
        label="Quote"
        rows={2}
        maxRows={8}
        maxLength={MediaExcerpt.shape.localRep.shape.quotation.maxLength}
        value={mediaExcerpt?.localRep?.quotation}
        disabled={disabled}
        onPropertyChange={onPropertyChange}
        onBlur={onBlur}
        onSubmit={onSubmit}
        messageProps={errorProps((me) => me.localRep.quotation)}
      />

      {mediaExcerpt.locators && (
        <fieldset className="url-locators">
          <legend>URLs</legend>
          <UrlLocatorsEditorFields
            id={combineIds(id, `locators.urlLocators`)}
            key={combineIds(id, `locators.urlLocators`)}
            name={combineNames(name, `locators.urlLocators`)}
            urlLocators={mediaExcerpt.locators.urlLocators}
            errors={errors?.locators?.urlLocators}
            dirtyFields={dirtyFields?.locators?.urlLocators}
            blurredFields={blurredFields?.locators?.urlLocators}
            editorDispatch={editorDispatch}
            disabled={disabled}
            suggestionsKey={suggestionsKey}
            onPropertyChange={onPropertyChange}
            wasSubmitAttempted={wasSubmitAttempted}
            onInferMediaExcerptInfo={onInferMediaExcerptInfo}
            onBlur={onBlur}
            onSubmit={onSubmit}
          />
        </fieldset>
      )}
      {mediaExcerpt.citations && (
        <fieldset>
          <legend>Citations</legend>
          <MediaExcerptCitationsEditorFields
            id={combineIds(id, `citations`)}
            key={combineIds(id, `citations`)}
            name={combineNames(name, `citations`)}
            citations={mediaExcerpt.citations}
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
        </fieldset>
      )}
      {mediaExcerpt.speakers && (
        <fieldset className="speakers">
          <legend>Speakers</legend>
          <MediaExcerptSpeakersEditorFields
            id={combineIds(id, `speakers`)}
            key={combineIds(id, `speakers`)}
            name={combineNames(name, `speakers`)}
            speakers={mediaExcerpt.speakers}
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
        </fieldset>
      )}
    </div>
  );
}
