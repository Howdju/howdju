import React from "react";
import { MaterialSymbol } from "react-material-symbols";

import {
  CreateMediaExcerptSpeakerInput,
  logger,
  makeCreateMediaExcerptSpeakerInput,
  PersorgOut,
} from "howdju-common";
import { toCreatePersorgInput } from "howdju-client-common";

import { EntityEditorFieldsProps } from "./withEditor";
import { combineIds, combineNames, combineSuggestionsKeys } from "@/viewModels";
import EntityViewer from "@/EntityViewer";
import PersorgEditorFields from "@/PersorgEditorFields";
import { EditorType } from "@/reducers/editors";
import { EditorId } from "@/types";
import { editors } from "@/actions";
import IconButton from "@/components/button/IconButton";
import { FontIcon } from "@react-md/icon";
import OutlineButton from "@/components/button/OutlineButton";

interface Props
  extends EntityEditorFieldsProps<
    "speakers",
    CreateMediaExcerptSpeakerInput[]
  > {}

export function MediaExcerptSpeakersEditorFields({
  id,
  name,
  disabled,
  onBlur,
  onPropertyChange,
  speakers,
  wasSubmitAttempted,
  errors,
  dirtyFields,
  blurredFields,
  suggestionsKey,
  editorDispatch,
  onSubmit,
}: Props) {
  function onAddSpeaker() {
    if (!name) {
      logger.error(
        `Unable to add a speaker when editor fields name is not provided.`
      );
      return;
    }
    editorDispatch((editorType: EditorType, editorId: EditorId) =>
      editors.addListItem(
        editorType,
        editorId,
        name,
        speakers?.length ?? 0,
        makeCreateMediaExcerptSpeakerInput
      )
    );
  }

  function onRemoveSpeaker(index: number) {
    if (!name) {
      logger.error(
        `Unable to remove a speaker when editor fields name is not provided.`
      );
      return;
    }
    editorDispatch((editorType: EditorType, editorId: EditorId) =>
      editors.removeListItem(editorType, editorId, name, index)
    );
  }

  function onPersorgAutocomplete(persorg: PersorgOut, index: number) {
    if (!name) {
      logger.error(
        `Unable to edit a speker when editor fields name is not provided.`
      );
      return;
    }
    editorDispatch((editorType: EditorType, editorId: EditorId) =>
      editors.replaceListItem(
        editorType,
        editorId,
        name,
        index,
        makeCreateMediaExcerptSpeakerInput({
          persorg: toCreatePersorgInput(persorg),
        })
      )
    );
  }

  return (
    <div>
      {speakers?.map(({ persorg }, index) => {
        return (
          <EntityViewer
            icon="person"
            iconTitle="Person/Organization"
            key={index}
            menu={
              <IconButton
                onClick={() => onRemoveSpeaker(index)}
                title="Delete speaker"
              >
                <FontIcon>delete</FontIcon>
              </IconButton>
            }
            entity={
              <PersorgEditorFields
                id={combineIds(id, `[${index}].persorg`)}
                key={combineIds(id, `[${index}].persorg`)}
                persorg={persorg}
                suggestionsKey={combineSuggestionsKeys(
                  suggestionsKey,
                  `[${index}].persorg`
                )}
                name={combineNames(name, `[${index}].persorg`)}
                disabled={disabled}
                onPersorgNameAutocomplete={(persorg: PersorgOut) =>
                  onPersorgAutocomplete(persorg, index)
                }
                onPropertyChange={onPropertyChange}
                errors={errors?.[index]}
                wasSubmitAttempted={wasSubmitAttempted}
                blurredFields={blurredFields?.[index]}
                dirtyFields={dirtyFields?.[index]}
                onSubmit={onSubmit}
                onBlur={onBlur}
                editorDispatch={editorDispatch}
              />
            }
          />
        );
      })}
      <OutlineButton
        icon={<MaterialSymbol icon="person_add" />}
        onClick={onAddSpeaker}
        title="Add speaker"
        disabled={disabled}
      >
        Add Speaker
      </OutlineButton>
    </div>
  );
}
