import React, { useState } from "react";
import { Button, DialogContainer } from "react-md";
import { MaterialSymbol } from "react-material-symbols";
import { isEmpty } from "lodash";

import {
  CreateMediaExcerptInput,
  UpdateMediaExcerptInput,
  PersorgOut,
  MediaExcerptCitation,
  MediaExcerpt,
  makePersorg,
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
import SourceDescriptionAutocomplete from "@/SourceDescriptionAutocomplete";

import "./MediaExcerptEditorFields.scss";

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

  function onRemoveSpeakerClick(index: number) {
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

  const [
    isSourceDescriptionHelpDialogVisible,
    setIsSourceDescriptionHelpDialogVisible,
  ] = useState(false);
  function showSourceDescriptionHelpDialog() {
    setIsSourceDescriptionHelpDialogVisible(true);
  }
  function hideSourceDescriptionHelpDialog() {
    setIsSourceDescriptionHelpDialogVisible(false);
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

      {mediaExcerpt?.locators?.urlLocators.map(({ url, anchors }, index) => (
        <SingleLineTextField
          {...errorProps((me) => me.locators?.urlLocators[index].url)}
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
      <fieldset>
        <legend>Citations</legend>
        {mediaExcerpt?.citations?.map(({ source, pincite }, index) => (
          <React.Fragment key={combineIds(id, `citations[${index}]`)}>
            <SourceDescriptionAutocomplete
              {...errorProps((me) => me.citations?.[index].source.description)}
              id={combineIds(id, `citations[${index}].source.description`)}
              name={combineNames(
                name,
                `citations[${index}].source.description`
              )}
              key={combineIds(id, `citations[${index}].source.description`)}
              suggestionsKey={combineSuggestionsKeys(
                suggestionsKey,
                `citations[${index}].source.description`
              )}
              label="Description"
              required
              rows={1}
              maxRows={2}
              maxLength={
                MediaExcerptCitation.shape.source.shape.description.maxLength
              }
              value={source.description}
              onBlur={onBlur}
              onPropertyChange={onPropertyChange}
              disabled={disabled}
              helpText={
                <span>
                  MLA-like, omitting the authors{" "}
                  <Button onClick={showSourceDescriptionHelpDialog}>
                    <MaterialSymbol icon="help" />
                  </Button>
                </span>
              }
            />
            <DialogContainer
              id="source-description-help-dialog"
              visible={isSourceDescriptionHelpDialogVisible}
              title="About Source Description"
              onHide={hideSourceDescriptionHelpDialog}
              className="source-description-help-dialog"
            >
              <p>
                The preferred style is MLA-like, but omitting the Authors:
                <ul>
                  <li>
                    The title of the source comes first and should be in quotes
                    unless it is the only field.
                  </li>
                  <li>
                    The date format should be ISO 8601 (YYYY-MM-DD) unless the
                    source is updated frequently, in which case including the
                    time is recommended.
                  </li>
                </ul>
              </p>
              <p>
                Examples:
                <ul>
                  <li>
                    “Russia Accuses Prigozhin of Trying to Mount a Coup: Live
                    Updates” The New York Times (2023-06-23)
                  </li>
                  <li>
                    “Comparison of Blood and Brain Mercury Levels in Infant
                    Monkeys Exposed to Methylmercury or Vaccines Containing
                    Thimerosal” Environmental Health Perspectives vol. 113,8
                    (2005): 1015. doi:10.1289/ehp.7712
                  </li>
                </ul>
              </p>
              <Button raised primary onClick={hideSourceDescriptionHelpDialog}>
                Close
              </Button>
            </DialogContainer>
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
      {mediaExcerpt?.speakers?.map((speaker, index) => {
        return (
          <EntityViewer
            icon="person"
            iconTitle="Person/Organization"
            key={index}
            menu={
              <Button
                icon
                onClick={() => onRemoveSpeakerClick(index)}
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
        onClick={() =>
          editorDispatch((editorType: EditorType, editorId: EditorId) =>
            editors.addListItem(
              editorType,
              editorId,
              mediaExcerpt?.speakers?.length ?? 0,
              combineNames(name, "speakers"),
              makePersorg
            )
          )
        }
        title="Add speaker"
        disabled={disabled}
      >
        Add Speaker
      </Button>
    </div>
  );
}
