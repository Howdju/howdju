import { put, call, takeEvery, select } from "typed-redux-saga";
import isFunction from "lodash/isFunction";
import { identity, reduce, reverse, startCase } from "lodash";
import { z } from "zod";
import { PrepareAction } from "@reduxjs/toolkit";

import {
  CreateJustification,
  CreatePersorg,
  CreatePersorgInput,
  CreateProposition,
  CreateStatement,
  CreateStatementInput,
  EditProposition,
  IssueFormat,
  isRef,
  JustificationTargetTypes,
  ModelErrors,
  newProgrammingError,
  demuxCreateJustificationInput,
  muxCreateJustificationErrors,
  CreateJustifiedSentenceInput,
  CreateJustificationInput,
  Justification,
  CreateCounterJustificationInput,
  CreateCounterJustification,
  CreateRegistrationConfirmation,
  User,
  AuthToken,
  CreateRegistrationConfirmationInput,
} from "howdju-common";

import { selectEditorState } from "../../selectors";
import { EditorEntity, EditorState, EditorType } from "../../reducers/editors";
import { api, editors, str } from "../../actions";
import { newEditorCommitResultError } from "../../uiErrors";
import { callApiForResource } from "../resourceApiSagas";
import { EditorAction } from "@/editors/editorTypes";
import app from "@/app/appSlice";
import { constructStatement } from "@/viewModels";
import {
  AnyApiAction,
  ApiActionCreator,
  ApiResponseAction,
} from "@/apiActions";

/**
 * A redux saga handling editor commits.
 *
 * Including translating to an API action and error handling.
 */
export function* editorCommitEdit() {
  yield* takeEvery(
    str(editors.commitEdit),
    function* editorCommitEditWorker(action: EditorAction) {
      const { editorType, editorId } = action.payload;

      const editorState: EditorState<any> = yield* select(
        selectEditorState(editorType, editorId)
      );
      const { editEntity } = editorState;
      const editorCommitApiResourceAction = createEditorCommitApiResourceAction(
        editorType,
        editEntity
      );
      try {
        const resultAction: ApiResponseAction<any> = yield call(
          callApiForResource,
          editorCommitApiResourceAction as AnyApiAction
        );
        if (resultAction.error) {
          return yield* put(
            editors.commitEdit.result(
              newEditorCommitResultError(
                editorType,
                editorId,
                resultAction.payload
              )
            )
          );
        }
        if (resultAction.payload.alreadyExists) {
          yield* put(
            app.addToast(`That ${startCase(editorType)} already exists.`)
          );
        }
        return yield* put(
          editors.commitEdit.result(editorType, editorId, resultAction.payload)
        );
      } catch (error) {
        return yield* put(
          editors.commitEdit.result(
            newEditorCommitResultError(editorType, editorId, error as Error)
          )
        );
      }
    }
  );
}

/** Returns the action corresponding to the appropriate CRUD action for an edit entity */
function createEditorCommitApiResourceAction<E extends EditorType>(
  editorType: E,
  editEntity: EditorEntity
) {
  const editorCommitConfig = editorCommitConfigs[editorType];
  if (!editorCommitConfig) {
    throw new Error(`No editor commit config for editor type ${editorType}`);
  }

  // editModels lacking an ID only support creation (e.g. JustifiedProposition.)
  const crudType =
    !("id" in editEntity) || !editEntity.id
      ? CrudActions.CREATE
      : CrudActions.UPDATE;
  const crudActionConfig = editorCommitConfig[crudType];
  if (!crudActionConfig) {
    throw new Error(
      `Missing ${crudType} CRUD action config for editor type ${editorType}.`
    );
  }
  let actionCreator;
  if (isFunction(crudActionConfig)) {
    // crudActionConfig is the action creator and there is no inputTransformer
    return crudActionConfig(editEntity);
  }
  const { inputTransformer = identity } = crudActionConfig;
  if ("requestActionCreator" in crudActionConfig) {
    if ("makeRequestActionCreator" in crudActionConfig) {
      throw newProgrammingError(
        "Only one of makeRequestActionCreator and requestActionCreator may be present."
      );
    }
    actionCreator = crudActionConfig.requestActionCreator;
  } else {
    actionCreator = crudActionConfig.makeRequestActionCreator(
      editEntity,
      crudType
    );
  }
  // I'm not sure why actionCreator might not be callable here; I thought that ApiActionCreator
  // should always be callable.
  if (!isFunction(actionCreator)) {
    throw newProgrammingError(
      "Action creators must be callable and accept the transformed editEntity."
    );
  }
  return actionCreator(inputTransformer(editEntity));
}

const CrudActions = { CREATE: "CREATE", UPDATE: "UPDATE" } as const;
type CrudAction = typeof CrudActions[keyof typeof CrudActions];

/**
 * Config for commiting an editor.
 *
 * The config can be a single EditorCommitCrudActionConfig that applies to all CRUD types, or
 * individual configs per CRUD type.
 */
type EditorCommitConfig = {
  // Each CRUD type may take its own types, so we have a lot of anys.
  [key in CrudAction]?:
    | EditorCommitCrudActionConfig<any, any, any, any, any>
    | ApiActionCreator<any, any, any>;
};
/**
 * Config for commiting one CRUD action of an editor.
 *
 * If this is the only config provided, then it applies to all CRUD actions.
 *
 * @typeparam T the input model type
 * @typeparam U the request model type (Create or Edit)
 * @typeparam P the request action creator payload type
 * @typeparam RP the response action creator payload type
 * @typeparam PA the prepare action type.
 */
export type EditorCommitCrudActionConfig<
  T extends EditorEntity,
  U,
  P,
  RP,
  PA extends void | PrepareAction<P>
> = {
  /**
   * Transforms the Input model into the request model
   *
   * If missing, the model is not transformed.
   *
   * TODO(26): this has overlap with apiActionCreator's prepare method, which translates the entity
   * into the request.
   */
  inputTransformer?: (model: T) => U;
  /**
   * Transforms the response errors into the input model errors.
   *
   * If missing, the errors are not transformed.
   */
  responseErrorTransformer?: (
    model: U,
    errors: ModelErrors<U>
  ) => ModelErrors<T>;
  /** The schema of the editor's request.
   *
   * If present, is used to determine whether the editor submission is valid.
   */
  requestSchema?: z.ZodType<U>;
} & (
  | {
      /**
       * The action creator to send the request.
       *
       * Only one of requestActionCreator and makeRequestActionCreator should be present.
       */
      requestActionCreator: ApiActionCreator<P, RP, PA>;
    }
  | {
      /**
       * Returns the action creator to send the request.
       *
       * Only one of requestActionCreator and makeRequestActionCreator should be present.
       */
      makeRequestActionCreator: (
        model: T,
        crudType: CrudAction
      ) => ApiActionCreator<P, RP, PA>;
    }
);

export const CreateJustificationConfig: EditorCommitCrudActionConfig<
  CreateJustificationInput,
  CreateJustification,
  { justification: CreateJustification },
  { justification: Justification },
  PrepareAction<{ justification: CreateJustification }>
> = {
  inputTransformer: demuxCreateJustificationInput,
  responseErrorTransformer: muxCreateJustificationErrors,
  requestActionCreator: api.createJustification,
  requestSchema: CreateJustification,
};

export const CreateCounterJustificationConfig: EditorCommitCrudActionConfig<
  CreateCounterJustificationInput,
  CreateCounterJustification,
  { justification: CreateCounterJustification },
  { justification: Justification },
  PrepareAction<{ justification: CreateCounterJustification }>
> = {
  inputTransformer: demuxCreateJustificationInput,
  responseErrorTransformer: muxCreateJustificationErrors,
  requestActionCreator: api.createCounterJustification,
  requestSchema: CreateCounterJustification,
};

export const CreateRegistrationConfirmationConfig: EditorCommitCrudActionConfig<
  CreateRegistrationConfirmationInput,
  CreateRegistrationConfirmation,
  { registrationConfirmation: CreateRegistrationConfirmation },
  { user: User; authToken: AuthToken; expires: string },
  PrepareAction<{ registrationConfirmation: CreateRegistrationConfirmation }>
> = {
  requestSchema: CreateRegistrationConfirmation,
  requestActionCreator: api.confirmRegistration,
};

export const editorCommitConfigs: Partial<
  Record<EditorType, EditorCommitConfig>
> = {
  PROPOSITION: {
    // Create propositions through the JustifiedSentence endpoint.
    UPDATE: {
      requestActionCreator: api.updateProposition,
      requestSchema: EditProposition,
    },
  },
  PROPOSITION_JUSTIFICATION: {
    CREATE: {
      inputTransformer(model: CreateJustifiedSentenceInput) {
        const { speakers, doCreateJustification, proposition } = model;
        if (speakers.length) {
          const statement = constructStatement(speakers, proposition);

          if (!doCreateJustification) {
            return statement;
          }

          const justification = demuxCreateJustificationInput(
            model.justification
          );
          justification.target = {
            entity: statement,
            type: JustificationTargetTypes.STATEMENT,
          };
          return justification;
        }

        if (!doCreateJustification) {
          return proposition;
        }
        const justification = demuxCreateJustificationInput(
          model.justification
        );
        justification.target.entity = model.proposition;
        return justification;
      },
      responseErrorTransformer: transformCreateJustifiedSentenceErrors,
      makeRequestActionCreator(model: CreateJustifiedSentenceInput) {
        const { doCreateJustification, speakers } = model;
        if (doCreateJustification) {
          return api.createJustification;
        }
        return speakers.length ? api.createStatement : api.createProposition;
      },
    },
  },
  NEW_JUSTIFICATION: {
    // Editing justifications is not supported
    CREATE: CreateJustificationConfig,
  },
  COUNTER_JUSTIFICATION: {
    CREATE: CreateCounterJustificationConfig,
  },
  WRIT_QUOTE: {
    CREATE: api.createWritQuote,
    UPDATE: api.updateWritQuote,
  },
  LOGIN_CREDENTIALS: {
    CREATE: api.login,
  },
  REGISTRATION_REQUEST: {
    CREATE: api.requestRegistration,
  },
  REGISTRATION_CONFIRMATION: {
    CREATE: CreateRegistrationConfirmationConfig,
  },
  PERSORG: {
    UPDATE: api.updatePersorg,
  },
  ACCOUNT_SETTINGS: {
    CREATE: api.createAccountSettings,
    UPDATE: api.updateAccountSettings,
  },
  CONTENT_REPORT: {
    CREATE: api.createContentReport,
  },
};

/** Translates CreateJustifiedSentence errors into input model errors. */
function transformCreateJustifiedSentenceErrors(
  model: CreateJustification,
  modelErrors: ModelErrors<CreateJustification>
): ModelErrors<CreateJustifiedSentenceInput>;
function transformCreateJustifiedSentenceErrors(
  model: CreateStatement,
  modelErrors: ModelErrors<CreateStatement>
): ModelErrors<CreateJustifiedSentenceInput>;
function transformCreateJustifiedSentenceErrors(
  model: CreateProposition,
  modelErrors: ModelErrors<CreateProposition>
): ModelErrors<CreateJustifiedSentenceInput>;
function transformCreateJustifiedSentenceErrors(
  model: CreateJustification | CreateStatement | CreateProposition,
  errors: ModelErrors<CreateJustification | CreateStatement | CreateProposition>
): ModelErrors<CreateJustifiedSentenceInput> {
  const inputErrors: ModelErrors<CreateJustifiedSentenceInput> = {
    _errors: [],
  };
  // If it's a justification, grab the target. If it's a sentence, pull off the speakers and
  // proposition. Otherwise it's a proposition.
  if ("target" in model) {
    const justificationErrors = errors as ModelErrors<CreateJustification>;
    inputErrors.justification = justificationErrors;
    const { target } = model;
    switch (target.type) {
      case "JUSTIFICATION":
        throw newProgrammingError(
          "A CreateJustifiedSentence cannot target a justification"
        );
      case "STATEMENT":
        {
          if (isRef(target.entity)) {
            throw newProgrammingError(
              "CreateJustifiedSentence does not support Refs"
            );
          }
          setCreateJustifiedSentenceErrorsFromStatement(
            inputErrors,
            target.entity,
            justificationErrors.target?.entity as
              | ModelErrors<CreateStatementInput>
              | undefined
          );
        }
        break;
      case "PROPOSITION":
        inputErrors.proposition = justificationErrors.target?.entity;
        break;
    }
  } else if ("sentence" in model) {
    setCreateJustifiedSentenceErrorsFromStatement(inputErrors, model, errors);
  } else {
    inputErrors.proposition = errors;
  }
  return inputErrors;
}

function setCreateJustifiedSentenceErrorsFromStatement(
  inputErrors: ModelErrors<CreateJustifiedSentenceInput>,
  statement: CreateStatement,
  statementErrors: ModelErrors<CreateStatementInput> | undefined
) {
  let sentenceErrors = statementErrors;
  let sentence = statement;
  const speakerErrors: (ModelErrors<CreatePersorgInput> | undefined)[] = [];
  while (sentence.sentenceType === "STATEMENT" && sentenceErrors) {
    speakerErrors.push(sentenceErrors.speaker);
    sentence = sentence.sentence;
    sentenceErrors = sentenceErrors.sentence;
  }

  inputErrors.proposition = sentenceErrors;
  inputErrors.speakers = reduce(
    reverse(speakerErrors),
    (acc, val, idx) => {
      acc[idx] = val || { _errors: [] };
      return acc;
    },
    { _errors: [] } as {
      _errors: IssueFormat[];
      [k: number]: ModelErrors<CreatePersorg>;
    }
  );
}
