import React from "react";
import { Button } from "react-md";

import {
  CreateMediaExcerptInput,
  UpdateMediaExcerptInput,
  PersorgOut,
  CreatePersorgInput,
  MediaExcerptCitation,
  MediaExcerpt,
} from "howdju-common";

import { combineNames, combineIds, combineSuggestionsKeys } from "@/viewModels";

import {
  EditorFieldsDispatch,
  EntityEditorFieldsProps,
} from "@/editors/withEditor";
import { makeErrorPropCreator } from "@/modelErrorMessages";

import "./JustificationEditorFields.scss";
import TextField from "@/TextField";
import SingleLineTextField from "@/SingleLineTextField";
import { isEmpty } from "lodash";
import { EditorType } from "@/reducers/editors";
import EntityViewer from "@/EntityViewer";
import PersorgEditorFields from "@/PersorgEditorFields";
import { editors } from "@/actions";
import { toCreatePersorgInput } from "howdju-client-common";
import { EditorId } from "@/types";
import SourceDescriptionAutocomplete from "@/SourceDescriptionAutocomplete";

interface Props
  extends EntityEditorFieldsProps<
    "mediaExcerpt",
    CreateMediaExcerptInput | UpdateMediaExcerptInput
  > {
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

  const onRemoveUrl = (index: number) =>
    editorDispatch((editorType: EditorType, editorId: string) =>
      editors.removeListItem(
        editorType,
        editorId,
        index,
        combineNames(name, "urls")
      )
    );

  function onRemoveSpeakerClick(speaker: CreatePersorgInput, index: number) {
    editorDispatch((editorType: EditorType, editorId: EditorId) =>
      editors.removeSpeaker(editorType, editorId, speaker, index)
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

  return (
    <div>
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

      {mediaExcerpt?.locators.urlLocators.map(({ url, anchors }, index) => (
        <SingleLineTextField
          {...errorProps((me) => me.locators.urlLocators[index].url)}
          id={combineIds(id, `remoteProcs.urlLocators[${index}].url`)}
          key={combineIds(id, `remoteProcs.urlLocators[${index}].url`)}
          name={combineNames(name, `remoteProcs.urlLocators[${index}].url`)}
          className="writ-quote-url-input"
          aria-label="url"
          type="url"
          label="URL"
          value={url.url}
          rightIcon={
            <Button icon onClick={() => onRemoveUrl(index)} disabled={disabled}>
              delete
            </Button>
          }
          rightIconStateful={false}
          disabled={disabled || !isEmpty(anchors)}
          onBlur={onBlur}
          onPropertyChange={onPropertyChange}
          onSubmit={onSubmit}
        />
      ))}

      {mediaExcerpt?.citations?.map(({ source, pincite }, index) => (
        <React.Fragment key={combineIds(id, `sources[${index}])`)}>
          <SourceDescriptionAutocomplete
            {...errorProps((me) => me.citations?.[index].source.descriptionApa)}
            id={combineIds(id, `sources[${index}].source.descriptionApa)`)}
            name={combineNames(
              name,
              `sources[${index}].source.descriptionApa)`
            )}
            key={combineIds(id, `sources[${index}].source.descriptionApa)`)}
            suggestionsKey={combineSuggestionsKeys(
              suggestionsKey,
              `sources[${index}].source.descriptionApa)`
            )}
            label="Description (APA)"
            required
            rows={1}
            maxRows={2}
            maxLength={
              MediaExcerptCitation.shape.source.shape.descriptionApa.maxLength
            }
            value={source.descriptionApa}
            onBlur={onBlur}
            onPropertyChange={onPropertyChange}
            disabled={disabled}
          />
          <TextField
            {...errorProps((me) => me.citations?.[index].pincite)}
            id={combineIds(id, `sources[${index}].pincite)`)}
            name={combineNames(name, `sources[${index}].pincite)`)}
            key={combineIds(id, `sources[${index}].pincite)`)}
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
      {mediaExcerpt?.speakers?.map((speaker, index) => {
        return (
          <EntityViewer
            iconName="person"
            iconTitle="Person/Organization"
            key={index}
            menu={
              <Button
                icon
                onClick={() => onRemoveSpeakerClick(speaker, index)}
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
    </div>
  );
}
