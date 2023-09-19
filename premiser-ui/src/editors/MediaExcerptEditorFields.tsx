import React from "react";
import { Button } from "react-md";
import { MaterialSymbol } from "react-material-symbols";

import {
  CreateMediaExcerptInput,
  extractQuotationFromTextFragment,
  MediaExcerpt,
  makeCreateMediaExcerptSpeakerInput,
  PersorgOut,
} from "howdju-common";
import { toCreatePersorgInput } from "howdju-client-common";

import { combineNames, combineIds, combineSuggestionsKeys } from "@/viewModels";
import {
  EditorFieldsDispatch,
  EntityEditorFieldsProps,
} from "@/editors/withEditor";
import { makeErrorPropCreator } from "@/modelErrorMessages";
import TextField from "@/TextField";
import { EditorType } from "@/reducers/editors";
import EntityViewer from "@/EntityViewer";
import PersorgEditorFields from "@/PersorgEditorFields";
import { editors } from "@/actions";
import { EditorId } from "@/types";
import UrlLocatorsEditorFields from "./UrlLocatorsEditorFields";

import "./MediaExcerptEditorFields.scss";
import { MediaExcerptCitationsEditorFields } from "./MediaExcerptCitationsEditorFields";

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

  function onAddSpeaker() {
    editorDispatch((editorType: EditorType, editorId: EditorId) =>
      editors.addListItem(
        editorType,
        editorId,
        combineNames(name, "speakers"),
        mediaExcerpt?.speakers?.length ?? 0,
        makeCreateMediaExcerptSpeakerInput
      )
    );
  }

  function onRemoveSpeaker(index: number) {
    editorDispatch((editorType: EditorType, editorId: EditorId) =>
      editors.removeListItem(
        editorType,
        editorId,
        combineNames(name, "speakers"),
        index
      )
    );
  }
  function onPersorgAutocomplete(persorg: PersorgOut, index: number) {
    editorDispatch((editorType: EditorType, editorId: EditorId) =>
      editors.replaceListItem(
        editorType,
        editorId,
        combineNames(name, "speakers"),
        index,
        makeCreateMediaExcerptSpeakerInput({
          persorg: toCreatePersorgInput(persorg),
        })
      )
    );
  }

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
      <TextField
        {...errorProps((me) => me.localRep.quotation)}
        id={combineIds(id, "localRep.quotation")}
        name={combineNames(name, "localRep.quotation")}
        label="Quote"
        rows={2}
        maxRows={8}
        maxLength={MediaExcerpt.shape.localRep.shape.quotation.maxLength}
        value={mediaExcerpt?.localRep?.quotation}
        onBlur={onBlur}
        onPropertyChange={onPropertyChange}
        disabled={disabled}
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
            errors={errors?.locators?.urlLocators}
            dirtyFields={dirtyFields?.locators?.urlLocators}
            blurredFields={blurredFields?.locators?.urlLocators}
            editorDispatch={editorDispatch}
            disabled={disabled}
            suggestionsKey={suggestionsKey}
            onPropertyChange={onPropertyChange}
            wasSubmitAttempted={wasSubmitAttempted}
          />
        </fieldset>
      )}
      <fieldset className="speakers">
        <legend>Speakers</legend>
        {mediaExcerpt?.speakers?.map(({ persorg }, index) => {
          return (
            <EntityViewer
              icon="person"
              iconTitle="Person/Organization"
              key={index}
              menu={
                <Button
                  icon
                  onClick={() => onRemoveSpeaker(index)}
                  title="Delete speaker"
                >
                  delete
                </Button>
              }
              entity={
                <PersorgEditorFields
                  id={combineIds(id, `speakers[${index}].persorg`)}
                  key={combineIds(id, `speakers[${index}].persorg`)}
                  persorg={persorg}
                  suggestionsKey={combineSuggestionsKeys(
                    suggestionsKey,
                    `speakers[${index}].persorg`
                  )}
                  name={combineNames(name, `speakers[${index}].persorg`)}
                  disabled={disabled}
                  onPersorgNameAutocomplete={(persorg: PersorgOut) =>
                    onPersorgAutocomplete(persorg, index)
                  }
                  onPropertyChange={onPropertyChange}
                  errors={errors?.speakers?.[index]}
                  wasSubmitAttempted={wasSubmitAttempted}
                  blurredFields={blurredFields?.speakers?.[index]}
                  dirtyFields={dirtyFields?.speakers?.[index]}
                  onSubmit={onSubmit}
                  editorDispatch={editorDispatch}
                />
              }
            />
          );
        })}
        <Button
          iconEl={<MaterialSymbol icon="person_add" />}
          raised
          onClick={onAddSpeaker}
          title="Add speaker"
          disabled={disabled}
        >
          Add Speaker
        </Button>
      </fieldset>
    </div>
  );
}
