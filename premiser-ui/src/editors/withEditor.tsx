import React from "react";
import { Button, CardActions, CardText, CircularProgress } from "react-md";
import { useDispatch, useSelector } from "react-redux";
import get from "lodash/get";
import reduce from "lodash/reduce";

import { BespokeValidationErrors } from "howdju-common";
import { validate, emptyValidationResult } from "howdju-ajv-sourced";

import { editors, flows } from "@/actions";
import { AppDispatch, RootState } from "@/setupStore";
import {
  combineIds,
  combineSuggestionsKeys,
} from "@/viewModels";
import t, {
  CANCEL_BUTTON_LABEL,
  EDIT_ENTITY_SUBMIT_BUTTON_LABEL,
} from "@/texts";
import { AnyAction } from "redux";
import {
  DirtyFields,
  EditorState,
  EditorType,
} from "@/reducers/editors";
import { logger, SchemaId, toJson } from "howdju-common";
import { isEqual, merge } from "lodash";
import {
  ComponentId,
  ComponentName,
  EditorId,
  OnPropertyChangeCallback,
  OnSubmitCallback,
  SuggestionsKey,
} from "@/types";

export type CommitThenPutAction = {
  // TODO(1): make specific to actions: ReturnType<ActionCreator> ActionCreator in keyof Group in keyof actions
  action: AnyAction;
};

type ListItemTranslator = (
  editorType: EditorType,
  editorId: string,
  dispatch: AppDispatch
) => (...args: any[]) => void;

export type WithEditorProps = {
  id: ComponentId;
  name: ComponentName;
  editorId: EditorId;
  className?: string;
  submitButtonText?: string;
  editorCommitBehavior?: "JustCommit" | "CommitThenView" | CommitThenPutAction;
};
export type EntityEditorFieldsProps = {
  id: ComponentId;
  name: ComponentName;
  disabled: boolean;
  suggestionsKey: SuggestionsKey;
  onPropertyChange: OnPropertyChangeCallback;
  onSubmit: OnSubmitCallback;
  errors: BespokeValidationErrors;
  dirtyFields: DirtyFields;
  wasSubmitAttempted: boolean;
};

/**
 * A HOC for creating a form for editing an entity.
 *
 * Fires the appropriate editor actions for editing, submitting, and canceling.
 *
 * @param editorType The editor type to determine editor behaviors and state location.
 * @param EntityEditorFields The EditorFields class for the entity.
 * @param entityPropName The field on EntityEditorFields for the editEntity
 * @param schemaId: The ID of the schema to use to validate the entity.
 * @param listItemTranslators An object keyed by callbacks for attributes of
 *   EntityEditorFields that produce callbacks that will dispatch the
 *   correct addListItem/removeListItem editor actions.
 * @typeparam P the type of Props that EntityEditorFields requires.
 */
export default function withEditor<
  P extends EntityEditorFieldsProps,
  LIT extends { [key: string]: ListItemTranslator }
>(
  editorType: EditorType,
  EntityEditorFields: React.FC<P>,
  entityPropName: string,
  schemaId: SchemaId,
  listItemTranslators?: LIT
) {
  type RestPropsKeys = Exclude<
    keyof P,
    keyof EntityEditorFieldsProps | keyof LIT
  >;
  // For some reason accessing the optional fields like
  // `type RestProps = {[key in RestPropsKeys]: P[key]}`
  // was making them non-optional. So separate them so that we can ensure they are optional (`+?`).
  type OptionalRestPropsKeys = {
    [key in RestPropsKeys as undefined extends P[key] ? key : never]+?: P[key];
  };
  type RequiredRestPropsKeys = {
    [key in RestPropsKeys as undefined extends P[key] ? never : key]: P[key];
  };
  type RestProps = RequiredRestPropsKeys & OptionalRestPropsKeys;
  return function EntityEditor(props: WithEditorProps & RestProps) {
    const {
      id,
      name,
      editorId,
      className,
      submitButtonText,
      editorCommitBehavior = "JustCommit",
    } = props;

    const dispatch = useDispatch();

    const onPropertyChange = (properties: { [key: string]: string }) => {
      dispatch(editors.propertyChange(editorType, editorId, properties));
    };
    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (editorCommitBehavior === "JustCommit") {
        dispatch(editors.commitEdit(editorType, editorId));
      } else if (editorCommitBehavior === "CommitThenView") {
        dispatch(flows.commitEditThenView(editorType, editorId));
      } else if (editorCommitBehavior.action) {
        dispatch(
          flows.commitEditThenPutActionOnSuccess(
            editorType,
            editorId,
            editorCommitBehavior.action
          )
        );
      }
    };
    const onCancelEdit = () => {
      dispatch(editors.cancelEdit(editorType, editorId));
    };

    // Create callbacks to add/remove items from the lists in the entity.
    const listItemCallbackAttributes = reduce(
      listItemTranslators,
      (acc, translator, key) => {
        acc[key] = translator(editorType, editorId, dispatch);
        return acc;
      },
      {} as { [key: string]: (...args: any[]) => void }
    );

    const editorState = useSelector((state: RootState) =>
      get(state.editors, [editorType, editorId], {})
    );
    const {
      errors: apiValidationErrors,
      editEntity,
      isSaving,
      dirtyFields,
      wasSubmitAttempted,
    } = editorState as EditorState;

    const { errors: clientValidationErrors } = editEntity
      ? validate(schemaId, editEntity)
      : emptyValidationResult();
    // Because the API should validate the same data using the same schema, it shouldn't be possible
    // to receive API errors that didn't also fail client validation.
    if (
      apiValidationErrors &&
      !isEqual(clientValidationErrors, apiValidationErrors)
    ) {
      logger.error(
        `clientValidationErrors and apiValidationErrors do not match ` +
          `${toJson({ clientValidationErrors, apiValidationErrors })}`
      );
    }
    // apiValidationErrors comes after so that it will override clientValidationErrors, since ultimately the API
    // must accept the value.
    const errors = merge(clientValidationErrors, apiValidationErrors);

    const editorFieldsProps = {
      id,
      name,
      ...{ [entityPropName]: editEntity },
      disabled: isSaving,
      suggestionsKey: combineSuggestionsKeys(editorType, editorId),
      onPropertyChange,
      onSubmit,
      ...listItemCallbackAttributes,
      errors,
      dirtyFields,
      wasSubmitAttempted,
      // TODO(1): can we remove this typecast? https://stackoverflow.com/questions/74072249/
    } as unknown as P;

    return (
      <form onSubmit={onSubmit} className={className}>
        <CardText>
          <EntityEditorFields {...editorFieldsProps} />
        </CardText>
        <CardActions>
          {isSaving && (
            <CircularProgress key="progress" id={combineIds(id, "progress")} />
          )}
          <Button
            flat
            key="cancelButton"
            children={t(CANCEL_BUTTON_LABEL)}
            onClick={onCancelEdit}
            disabled={isSaving}
          />
          <Button
            raised
            primary
            key="submitButton"
            type="submit"
            children={t(submitButtonText || EDIT_ENTITY_SUBMIT_BUTTON_LABEL)}
            disabled={isSaving}
          />
        </CardActions>
      </form>
    );
  };
}
