import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnyAction } from "redux";
import { PrepareAction } from "@reduxjs/toolkit";
import { Button, CardActions, CardText, CircularProgress } from "react-md";
import get from "lodash/get";
import reduce from "lodash/reduce";
import { z } from "zod";
import { identity, merge } from "lodash";

import {
  formatZodError,
  ModelErrors,
  translateAjvToZodFormattedError,
  SchemaId,
} from "howdju-common";
import { validateRawErrors } from "howdju-ajv-sourced";

import { editors, flows } from "@/actions";
import { AppDispatch, RootState } from "@/setupStore";
import { combineIds, combineSuggestionsKeys } from "@/viewModels";
import t, {
  CANCEL_BUTTON_LABEL,
  EDIT_ENTITY_SUBMIT_BUTTON_LABEL,
} from "@/texts";
import {
  BlurredFields,
  DirtyFields,
  EditorEntity,
  EditorState,
  EditorType,
} from "@/reducers/editors";
import {
  ComponentId,
  ComponentName,
  EditorId,
  OnBlurCallback,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  OnSubmitCallback,
  OnValidityChangeCallback,
  SuggestionsKey,
} from "@/types";
import { EditorCommitCrudActionConfig } from "@/sagas/editors/editorCommitEditSaga";
import SubmitButton from "./SubmitButton";

export class CommitThenPutAction {
  // TODO(1): make specific to actions: ReturnType<ActionCreator> ActionCreator in keyof Group in keyof actions
  action: AnyAction;
  constructor(action: AnyAction) {
    this.action = action;
  }
}

type ListItemTranslator = (
  editorType: EditorType,
  editorId: string,
  dispatch: AppDispatch
) => (...args: any[]) => void;

/**
 * The props of this HOC's components.
 *
 * These props are combined with those additionally required by the specific HOC invocation to get
 * the full props used by the derived component.
 */
export type WithEditorProps = {
  id: ComponentId;
  /** An optional name to prefix to the form's input's names. */
  name?: ComponentName;
  editorId: EditorId;
  className?: string;
  submitButtonText?: string;
  onKeyDown?: OnKeyDownCallback;
  showButtons?: boolean;
  onValidityChange?: OnValidityChangeCallback;
  editorCommitBehavior?: "JustCommit" | "CommitThenView" | CommitThenPutAction;
};
/**
 * The fields that must be present on the fields component.
 */
export type EntityEditorFieldsProps<T> = {
  /** This string will be prepended to this editor's controls' ids, with an intervening "." */
  id: ComponentId;
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name?: ComponentName;
  disabled: boolean;
  suggestionsKey: SuggestionsKey;
  onBlur?: OnBlurCallback;
  onPropertyChange: OnPropertyChangeCallback;
  onSubmit: OnSubmitCallback;
  errors?: ModelErrors<T>;
  blurredFields?: BlurredFields<T>;
  dirtyFields?: DirtyFields<T>;
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
 * @param schemaOrId: Either the Zod schema (preferred) or the ID of the AJV schema to use to validate the entity.
 * @param listItemTranslators An object keyed by callbacks for attributes of
 *   EntityEditorFields that produce callbacks that will dispatch the
 *   correct addListItem/removeListItem editor actions.
 * @typeparam P the type of Props that EntityEditorFields requires.
 * @typeparam LIT the type of the list item translator's object
 * @typeparam SchemaInput the type of model the editor edits.
 * @typeparam SchemaOutput the output of the schema validation, in case it has refinements.
 */
export default function withEditor<
  P extends EntityEditorFieldsProps<SchemaOutput>,
  LIT extends { [key: string]: ListItemTranslator },
  SchemaInput extends EditorEntity = any,
  SchemaOutput = SchemaInput,
  U = any,
  Y = any,
  RP = any,
  PA extends void | PrepareAction<Y> = void
>(
  editorType: EditorType,
  EntityEditorFields: React.FC<P>,
  entityPropName: string,
  schemaOrId: z.ZodType<SchemaOutput, z.ZodTypeDef, SchemaInput> | SchemaId,
  listItemTranslators?: LIT,
  commitConfig?: EditorCommitCrudActionConfig<SchemaInput, U, Y, RP, PA>
  /*
   * @typeparam T the input model type
   * @typeparam U the request model type (Create or Edit)
   * @typeparam P the request action creator payload type
   * @typeparam RP the response action creator payload type
   * @typeparam PA the prepare action type.
   * */
) {
  type RestPropsKeys = Exclude<
    keyof P,
    keyof EntityEditorFieldsProps<SchemaOutput> | keyof LIT
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

  const validateEntity = (editEntity: EditorEntity | undefined) => {
    if (!editEntity) {
      return { value: editEntity };
    }
    if (schemaOrId instanceof z.ZodType) {
      const result = schemaOrId.safeParse(editEntity);
      if (result.success) {
        return { value: result.data };
      }
      return {
        value: editEntity,
        errors: formatZodError(result.error),
      };
    }
    const result = validateRawErrors(schemaOrId, editEntity);
    if (result.isValid) {
      return { value: editEntity };
    }
    return {
      value: editEntity,
      errors: translateAjvToZodFormattedError(result.errors),
    };
  };

  return function EntityEditor(props: WithEditorProps & RestProps) {
    const {
      id,
      name,
      editorId,
      className,
      submitButtonText,
      onKeyDown,
      onValidityChange,
      showButtons = true,
      editorCommitBehavior = "JustCommit",
    } = props;

    const editorState = useSelector((state: RootState) =>
      get(state.editors, [editorType, editorId])
    ) as EditorState<SchemaInput, U>;
    const {
      errors: apiValidationErrors,
      editEntity,
      isSaving,
      blurredFields,
      dirtyFields,
      wasSubmitAttempted,
    } = editorState;

    const dispatch = useDispatch();

    const onPropertyChange = (properties: { [key: string]: string }) => {
      dispatch(editors.propertyChange(editorType, editorId, properties));
    };
    const onBlur = (name: string) => {
      dispatch(editors.blurField(editorType, editorId, name));
    };

    const inputTransformer = commitConfig?.inputTransformer ?? identity;
    const requestEntity = editEntity && inputTransformer(editEntity);
    function isValidRequest(requestEntity: U | undefined) {
      if (!requestEntity) {
        // If there is no entity, we can't call it valid.
        return false;
      }
      if (!commitConfig?.requestSchema) {
        // Without request schema, we cannot validate the request.
        return true;
      }
      const result = commitConfig.requestSchema.safeParse(requestEntity);
      return result.success;
    }
    const isValid = isValidRequest(requestEntity);
    useEffect(() => {
      onValidityChange && onValidityChange(isValid);
    }, [isValid, onValidityChange]);

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (isSaving) {
        return;
      }

      if (!isValid) {
        dispatch(editors.attemptedSubmit(editorType, editorId));
        return;
      }

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

    const { errors: clientValidationErrors } = validateEntity(editEntity);

    const responseErrorTransformer = commitConfig?.responseErrorTransformer;
    const transformedApiValidationErrors =
      requestEntity && apiValidationErrors && responseErrorTransformer
        ? responseErrorTransformer(requestEntity, apiValidationErrors)
        : apiValidationErrors;
    // apiValidationErrors comes after so that it will override clientValidationErrors, since ultimately the API
    // must accept the value.
    const errors = merge(
      {},
      clientValidationErrors,
      transformedApiValidationErrors
    );

    const editorFieldsProps = {
      id,
      ...(name ? { name } : {}),
      ...{ [entityPropName]: editEntity },
      disabled: isSaving,
      suggestionsKey: combineSuggestionsKeys(editorType, editorId),
      onBlur,
      onPropertyChange,
      onSubmit,
      ...listItemCallbackAttributes,
      blurredFields,
      dirtyFields,
      errors,
      wasSubmitAttempted,
      onKeyDown,
      // TODO(1): can we remove this typecast? https://stackoverflow.com/questions/74072249/
    } as unknown as P;

    const submitButtonTitle = isValid
      ? "Submit"
      : wasSubmitAttempted
      ? "Please correct the errors to continue"
      : "Please complete the form to continue";

    return (
      <form onSubmit={onSubmit} className={className}>
        <CardText>
          <EntityEditorFields {...editorFieldsProps} />
        </CardText>
        <CardActions>
          {isSaving && (
            <CircularProgress key="progress" id={combineIds(id, "progress")} />
          )}
          {showButtons && [
            <Button
              flat
              key="cancelButton"
              children={t(CANCEL_BUTTON_LABEL)}
              onClick={onCancelEdit}
              disabled={isSaving}
            />,
            <SubmitButton
              key="submitButton"
              appearDisabled={!isValid || isSaving}
              title={submitButtonTitle}
              children={t(submitButtonText || EDIT_ENTITY_SUBMIT_BUTTON_LABEL)}
            />,
          ]}
        </CardActions>
      </form>
    );
  };
}
