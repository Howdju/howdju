import React, { MouseEvent } from "react";
import { Button } from "react-md";
import { MaterialSymbol } from "react-material-symbols";
import { isEmpty } from "lodash";

import {
  CreateMediaExcerptInput,
  extractQuotationFromTextFragment,
  MediaExcerptCitation,
  MediaExcerpt,
  makeCreatePersorg,
  makeCreateUrlLocatorInput,
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

import "./MediaExcerptEditorFields.scss";
import SourceEditorFields from "@/components/sources/SourceEditorFields";

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

  const onAddUrlLocator = (_event: MouseEvent<HTMLElement>) =>
    editorDispatch((editorType: EditorType, editorId: string) =>
      editors.addListItem(
        editorType,
        editorId,
        0,
        combineNames(name, "locators.urlLocators"),
        makeCreateUrlLocatorInput
      )
    );

  const onRemoveUrlLocator = (index: number) =>
    editorDispatch((editorType: EditorType, editorId: string) =>
      editors.removeListItem(
        editorType,
        editorId,
        index,
        combineNames(name, "locators.urlLocators")
      )
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

  function onInferMediaExcerptInfo(url: string) {
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
        {mediaExcerpt?.locators?.urlLocators.map(({ url, anchors }, index) => (
          <SingleLineTextField
            {...errorProps((me) => me.locators?.urlLocators[index].url.url)}
            id={combineIds(id, `locators.urlLocators[${index}].url.url`)}
            key={combineIds(id, `locators.urlLocators[${index}].url.url`)}
            name={combineNames(name, `locators.urlLocators[${index}].url.url`)}
            aria-label="url"
            type="url"
            label="URL"
            value={url.url}
            rightIcon={
              <>
                {!isEmpty(anchors) && (
                  <MaterialSymbol
                    key="anchor-icon"
                    className="url-anchor-icon"
                    icon="my_location"
                    size={16}
                    title="Has a fragment taking you directly to the excerpt"
                  />
                )}
                <Button
                  key="infer-media-excerpt-info-button"
                  icon
                  onClick={() => onInferMediaExcerptInfo(url.url)}
                  disabled={disabled || !url.url}
                >
                  <MaterialSymbol
                    icon="plagiarism"
                    size={22}
                    title="Infer quotation and source description"
                  />
                </Button>
                <Button
                  key="delete-url-locator-button"
                  icon
                  onClick={() => onRemoveUrlLocator(index)}
                  disabled={disabled}
                >
                  delete
                </Button>
              </>
            }
            rightIconStateful={false}
            disabled={disabled || !isEmpty(anchors)}
            onBlur={onBlur}
            onPropertyChange={onPropertyChange}
            onSubmit={onSubmit}
          />
        ))}
        {(mediaExcerpt?.locators?.urlLocators?.length ?? 0) < 1 && (
          <Button
            iconEl={<MaterialSymbol icon="add_link" />}
            raised
            onClick={onAddUrlLocator}
            title="Add URL locator"
            disabled={disabled}
          >
            Add URL locator
          </Button>
        )}
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
