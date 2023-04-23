import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { AnyAction } from "@reduxjs/toolkit";
import { Button, CardActions, CardText, CircularProgress } from "react-md";
import get from "lodash/get";
import { z } from "zod";
import { isArray, merge } from "lodash";

import {
  formatZodError,
  ModelErrors,
  translateAjvToZodFormattedError,
  SchemaId,
  logger,
  toJson,
} from "howdju-common";
import { validateRawErrors } from "howdju-ajv-sourced";

import { editors, flows } from "@/actions";
import { RootState } from "@/setupStore";
import {
  combineIds,
  combineSuggestionsKeys,
  defaultEditorId,
} from "@/viewModels";
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
  OnEventCallback,
  OnKeyDownCallback,
  OnPropertyChangeCallback,
  OnValidityChangeCallback,
  SuggestionsKey,
} from "@/types";
import {
  EditorCommitCrudActionConfig,
  getActionCreator,
} from "@/sagas/editors/editorCommitEditSaga";
import SubmitButton from "./SubmitButton";
import { useAppDispatch } from "@/hooks";
import { ServiceRoute } from "howdju-service-routes";

export class CommitThenPutAction {
  action: AnyAction;
  constructor(action: AnyAction) {
    this.action = action;
  }
}

/** Editor fields can return one or more actions to dispatch. */
export type EditorFieldsActionCreator = (
  editorType: EditorType,
  editorId: string
) => AnyAction | AnyAction[];
/** Editor fields pass a lambda to this method that returns actions to dispatch to the edit model. */
export type EditorFieldsDispatch = (
  actionCreator: EditorFieldsActionCreator
) => void;

/**
 * An editorDispatch for fields that don't really need it.
 *
 * TODO(341) remove this.
 */
export function noopEditorDispatch(_actionCreator: EditorFieldsActionCreator) {}

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
  editorId?: EditorId;
  className?: string;
  submitButtonText?: string;
  onKeyDown?: OnKeyDownCallback;
  showButtons?: boolean;
  onValidityChange?: OnValidityChangeCallback;
  editorCommitBehavior?: "JustCommit" | "CommitThenView" | CommitThenPutAction;
};
/**
 * The fields that must be present on the fields component.
 *
 * @typeparam T the validated model type (aka schema output.)
 */
export type EntityEditorFieldsProps<EntityProp extends string, Schema> = {
  /** This string will be prepended to this editor's controls' ids, with an intervening "." */
  id: ComponentId;
  /** If present, this string will be prepended to this editor's controls' names, with an intervening "." */
  name?: ComponentName;
  disabled: boolean;
  suggestionsKey: SuggestionsKey;
  onBlur?: OnBlurCallback;
  onPropertyChange: OnPropertyChangeCallback;
  onSubmit?: OnEventCallback;
  /**
   * To dispatch actions to update the edit entity.
   *
   * If the editor fields require dispatching actions to the editEntity, they can accept this
   * callback to do so. Editor type and ID will be passed to the action creator passed to editorDispatch.
   *
   * Editor fields that don't need this currently must accept it because I havent' figured how to
   * type it so that they can elect not to accept it. Maybe we could pass an editor config object
   * with a field noEditorDispatch that we could both type off of and also look at to optionally
   * omit editorDispatch from the props we pass to the fields.
   *
   * TODO(341) allow EditorFields components to omit editorDispatch.
   */
  editorDispatch: EditorFieldsDispatch;
  errors?: ModelErrors<Schema>;
  blurredFields?: BlurredFields<Schema>;
  dirtyFields?: DirtyFields<Schema>;
  wasSubmitAttempted: boolean;
} & EntityPropProps<EntityProp, Schema>;

type EntityPropProps<EntityProp extends string, EntityType> = {
  [key in EntityProp]?: EntityType;
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
 * @param commitConfig An optional commit config describing the API endpoint that commiting uses.
 *   When provided, the editor supports pre-request validation (prevents submission if the request
 *   would be invalid.)
 *   TODO(273): make commit config required
 * @typeparam EntityProp the name of the property containing the edit entity. It must have SchemaInput type.
 * @typeparam Props the type of props that EntityEditorFields requires.
 * @typeparam SchemaInput the type of model the editor edits.
 * @typeparam SchemaOutput the output of the schema validation, in case it has refinements.
 * @typeparam ApiModel the commit config's request model type (Create or Edit)
 */
export default function withEditor<
  EntityProp extends string,
  FieldsProps extends EntityEditorFieldsProps<EntityProp, SchemaInput>,
  Route extends ServiceRoute,
  SchemaInput extends EditorEntity = any,
  SchemaOutput = SchemaInput,
  ApiModel = any
>(
  editorType: EditorType,
  EntityEditorFields: React.FC<FieldsProps>,
  entityPropName: EntityProp,
  schemaOrId: z.ZodType<SchemaOutput, z.ZodTypeDef, SchemaInput> | SchemaId,
  commitConfig?: EditorCommitCrudActionConfig<SchemaInput, ApiModel, Route>
): React.FC<
  WithEditorProps &
    Omit<FieldsProps, keyof EntityEditorFieldsProps<EntityProp, SchemaOutput>> &
    EntityPropProps<EntityProp, SchemaInput>
> {
  return function EntityEditor(props: WithEditorProps) {
    const {
      id,
      name,
      editorId = defaultEditorId(id),
      className,
      submitButtonText,
      onKeyDown,
      onValidityChange,
      showButtons = true,
      editorCommitBehavior = "JustCommit",
      ...rest
    } = props;

    const editorState = useSelector((state: RootState) =>
      get(state.editors, [editorType, editorId])
    ) as EditorState<SchemaInput, ApiModel>;
    const {
      errors: apiValidationErrors,
      editEntity,
      isSaving,
      blurredFields,
      dirtyFields,
      wasSubmitAttempted,
    } = editorState;

    const dispatch = useAppDispatch();

    const onPropertyChange = (properties: { [key: string]: string }) => {
      dispatch(editors.propertyChange(editorType, editorId, properties));
    };
    const onBlur = (name: string) => {
      dispatch(editors.blurField(editorType, editorId, name));
    };

    const { errors, isValidRequest } =
      commitConfig && editEntity
        ? validateEditorEntity(
            commitConfig,
            schemaOrId,
            apiValidationErrors,
            editEntity
          )
        : { errors: undefined, isValidRequest: true };
    useEffect(() => {
      onValidityChange && onValidityChange(isValidRequest);
    }, [isValidRequest, onValidityChange]);

    const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      dispatch(editors.attemptedSubmit(editorType, editorId));

      if (isSaving) {
        return;
      }

      if (!isValidRequest) {
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
    const onSubmitClick = (_event: React.MouseEvent<HTMLElement>) => {
      dispatch(editors.attemptedSubmit(editorType, editorId));
    };
    const onCancelEdit = () => {
      dispatch(editors.cancelEdit(editorType, editorId));
    };

    function editorDispatch(actionCreator: EditorFieldsActionCreator) {
      const action = actionCreator(editorType, editorId);
      if (isArray(action)) {
        for (const a of action) {
          dispatch(a);
        }
      } else {
        dispatch(action);
      }
    }

    const editorFieldsProps = {
      id,
      ...(name ? { name } : {}),
      ...{ [entityPropName]: editEntity },
      ...rest,
      disabled: isSaving,
      suggestionsKey: combineSuggestionsKeys(editorType, editorId),
      onBlur,
      onPropertyChange,
      onSubmit,
      editorDispatch,
      blurredFields,
      dirtyFields,
      errors,
      wasSubmitAttempted,
      onKeyDown,
      // There appears to be no way around this typecast https://stackoverflow.com/questions/74072249/
    } as unknown as FieldsProps;

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
              disabled={isSaving}
              appearDisabled={!isValidRequest}
              title={submitButtonTitle(isValidRequest, wasSubmitAttempted)}
              children={t(submitButtonText || EDIT_ENTITY_SUBMIT_BUTTON_LABEL)}
              onClick={onSubmitClick}
            />,
          ]}
        </CardActions>
      </form>
    );
  };
}

export function submitButtonTitle(
  isValid: boolean,
  wasSubmitAttempted: boolean
) {
  return isValid
    ? "Submit"
    : wasSubmitAttempted
    ? "Please correct the errors to continue"
    : "Please complete the form to continue";
}

export function validateEditorEntity<
  SchemaInput extends EditorEntity,
  SchemaOutput,
  ApiModel,
  Route extends ServiceRoute
>(
  commitConfig: EditorCommitCrudActionConfig<SchemaInput, ApiModel, Route>,
  schemaOrId: z.ZodType<SchemaOutput, z.ZodTypeDef, SchemaInput> | SchemaId,
  apiValidationErrors: ModelErrors<ApiModel> | undefined,
  editEntity: SchemaInput
): { errors: ModelErrors<SchemaInput>; isValidRequest: boolean } {
  const { errors: clientValidationErrors } = validateEntity(
    schemaOrId,
    editEntity
  );

  const apiEntity = commitConfig.inputTransformer(editEntity);

  const actionCreator = getActionCreator(commitConfig, editEntity);
  const action = actionCreator(apiEntity);
  const request = {
    // Just add a string for the authToken so that it doesn't fail validation. Only the API can
    // validate authTokens. Technically this might be a place where we recognize that an authToken
    // is missing and redirect the user to the login page if they don't have one.
    // TODO(247): inlude placeholder conditional on actual authToken and redirect user to login if authToken validation fails.
    authToken: "placeholder-auth-token",
    body: action.payload.fetchInit.body,
    queryStringParams: action.meta.queryStringParams,
    pathParams: action.meta.pathParams,
  };
  const { isValidRequest, error: requestValidationError } = validateRequest(
    actionCreator.route.request.schema,
    request
  );
  if (!isValidRequest && !clientValidationErrors) {
    logger.error(
      `Entity editor has an invalid request without client validation errors. ` +
        `The user will have no feedback as to what the problem is. ` +
        "One of the two schemas is incorrect. " +
        `The requestValidationError is: ${toJson(requestValidationError)}`
    );
  }

  const responseErrorTransformer = commitConfig.responseErrorTransformer;
  const transformedApiValidationErrors =
    apiEntity && apiValidationErrors && responseErrorTransformer
      ? responseErrorTransformer(apiEntity, apiValidationErrors)
      : (apiValidationErrors as ModelErrors<SchemaInput>);
  // apiValidationErrors comes after so that it will override clientValidationErrors, since ultimately the API
  // must accept the value.
  const errors = merge(
    {},
    clientValidationErrors,
    transformedApiValidationErrors
  );
  return {
    errors,
    isValidRequest,
  };
}

function validateEntity<
  SchemaInput extends EditorEntity,
  SchemaOutput = SchemaInput
>(
  schemaOrId: z.ZodType<SchemaOutput, z.ZodTypeDef, SchemaInput> | SchemaId,
  editEntity: EditorEntity | undefined
) {
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
}

function validateRequest<U>(
  requestSchema: z.ZodType | undefined,
  requestEntity: U | undefined
) {
  if (!requestEntity) {
    // If there is no entity, we can't call it valid.
    return { isValidRequest: false };
  }
  if (!requestSchema) {
    // Without request schema, we cannot validate the request.
    return { isValidRequest: true };
  }
  const result = requestSchema.safeParse(requestEntity);
  if (result.success) {
    return { isValidRequest: true };
  }
  return { isValidRequest: false, error: result.error };
}
