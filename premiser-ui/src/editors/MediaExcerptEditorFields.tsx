import React from "react";
import { Button } from "react-md";
import { MaterialSymbol } from "react-material-symbols";

import {
  CreateMediaExcerptInput,
  extractQuotationFromTextFragment,
  MediaExcerptCitation,
  MediaExcerpt,
  makeCreatePersorg,
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
import SingleLineTextField from "@/SingleLineTextField";
import { EditorType } from "@/reducers/editors";
import EntityViewer from "@/EntityViewer";
import PersorgEditorFields from "@/PersorgEditorFields";
import { editors } from "@/actions";
import { EditorId } from "@/types";
import UrlLocatorsEditorFields from "./UrlLocatorsEditorFields";
import SourceEditorFields from "@/components/sources/SourceEditorFields";

import "./MediaExcerptEditorFields.scss";

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
        mediaExcerpt?.speakers?.length ?? 0,
        combineNames(name, "speakers"),
        makeCreatePersorg
      )
    );
  }

  function onRemoveSpeaker(index: number) {
    editorDispatch((editorType: EditorType, editorId: EditorId) =>
      editors.removeListItem(
        editorType,
        editorId,
        index,
        combineNames(name, "speakers")
      )
    );
  }
  function onPersorgAutocomplete(persorg: PersorgOut, index: number) {
    editorDispatch((editorType: EditorType, editorId: EditorId) =>
      editors.replaceSpeaker(
        editorType,
        editorId,
        toCreatePersorgInput(persorg),
        index
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

      <fieldset className="url-locators">
        <legend>URLs</legend>
        <UrlLocatorsEditorFields
          id={combineIds(id, `locators.urlLocators`)}
          key={combineIds(id, `locators.urlLocators`)}
          name={combineNames(name, `locators.urlLocators`)}
          urlLocators={mediaExcerpt?.locators?.urlLocators}
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
      <fieldset>
        <legend>Citations</legend>
        {mediaExcerpt?.citations?.map(({ source, pincite }, index) => (
          <React.Fragment key={combineIds(id, `citations[${index}]`)}>
            <SourceEditorFields
              id={id}
              source={source}
              key={combineIds(id, `citations[${index}].source`)}
              errors={errors?.citations?.[index]?.source}
              blurredFields={blurredFields?.citations?.[index]?.source}
              dirtyFields={dirtyFields?.citations?.[index]?.source}
              suggestionsKey={combineSuggestionsKeys(
                suggestionsKey,
                `citations[${index}].source`
              )}
              name={combineNames(name, `citations[${index}].source`)}
              editorDispatch={editorDispatch}
              disabled={disabled}
              onBlur={onBlur}
              onPropertyChange={onPropertyChange}
              wasSubmitAttempted={wasSubmitAttempted}
            />
            <SingleLineTextField
              {...errorProps((me) => me.citations?.[index].pincite)}
              id={combineIds(id, `citations[${index}].pincite`)}
              name={combineNames(name, `citations[${index}].pincite`)}
              key={combineIds(id, `citations[${index}].pincite`)}
              label="Pincite"
              rows={1}
              maxRows={2}
              maxLength={MediaExcerptCitation.shape.pincite.unwrap().maxLength}
              value={pincite}
              onBlur={onBlur}
              onPropertyChange={onPropertyChange}
              disabled={disabled}
            />
          </React.Fragment>
        ))}
      </fieldset>
      <fieldset className="speakers">
        <legend>Speakers</legend>
        {mediaExcerpt?.speakers?.map((speaker, index) => {
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
                  id={combineIds(id, `speakers[${index}]`)}
                  key={combineIds(id, `speakers[${index}]`)}
                  persorg={speaker}
                  suggestionsKey={combineSuggestionsKeys(
                    suggestionsKey,
                    `speakers[${index}]`
                  )}
                  name={combineNames(name, `speakers[${index}]`)}
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
