import { put, call, takeEvery, select } from "typed-redux-saga";
import isFunction from "lodash/isFunction";
import { identity, reduce, reverse, startCase } from "lodash";
import { z } from "zod";

import {
  CreateJustification,
  CreatePersorg,
  CreatePersorgInput,
  CreateProposition,
  CreateStatement,
  CreateStatementInput,
  UpdateProposition,
  IssueFormat,
  isRef,
  JustificationTargetTypes,
  ModelErrors,
  newProgrammingError,
  demuxCreateJustificationInput,
  muxCreateJustificationErrors,
  CreateJustifiedSentenceInput,
  CreateJustificationInput,
  CreateCounterJustificationInput,
  CreateCounterJustification,
  CreateRegistrationConfirmation,
  CreateRegistrationConfirmationInput,
  CreateRegistrationRequest,
  CreateRegistrationRequestInput,
} from "howdju-common";

import { selectEditorState } from "../../selectors";
import { EditorEntity, EditorState, EditorType } from "../../reducers/editors";
import { api, editors, str } from "../../actions";
import { newEditorCommitResultError } from "../../uiErrors";
import { callApiForResource } from "../resourceApiSagas";
import { EditorAction } from "@/editors/editorTypes";
import app from "@/app/appSlice";
import { constructStatementInput } from "@/viewModels";
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

  // editModels lacking an ID only support creation (e.g. JustifiedSentence.)
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
    | EditorCommitCrudActionConfig<any, any>
    | ApiActionCreator<any, any, any, any>
    | ApiActionCreator<any, any, never, any>;
};
/**
 * Config for commiting one CRUD action of an editor.
 *
 * If this is the only config provided, then it applies to all CRUD actions.
 *
 * @typeparam ClientModel the input model type
 * @typeparam ApiModel the request model type (Create or Edit)
 */
export type EditorCommitCrudActionConfig<
  ClientModel extends EditorEntity,
  ApiModel
> = {
  /**
   * Transforms the Input model into the request model
   *
   * If missing, the model is not transformed.
   *
   * TODO(26): this has overlap with apiActionCreator's prepare method, which translates the entity
   * into the request.
   */
  inputTransformer?: (model: ClientModel) => ApiModel;
  /**
   * Transforms the response errors into the input model errors.
   *
   * If missing, the errors are not transformed.
   */
  responseErrorTransformer?: (
    model: ApiModel,
    errors: ModelErrors<ApiModel>
  ) => ModelErrors<ClientModel>;
  /** The schema of the editor's request.
   *
   * If present, is used to determine whether the editor submission is valid.
   */
  requestSchema?: z.ZodType<ApiModel>;
} & (
  | {
      /**
       * The action creator to send the request.
       *
       * Only one of requestActionCreator and makeRequestActionCreator should be present.
       */
      requestActionCreator: ApiActionCreator<any, any, never, any>;
    }
  | {
      /**
       * Returns the action creator to send the request.
       *
       * Only one of requestActionCreator and makeRequestActionCreator should be present.
       */
      makeRequestActionCreator: (
        model: ClientModel,
        crudType: CrudAction
      ) => ApiActionCreator<any, any, never, any>;
    }
);

export const CreateJustificationConfig: EditorCommitCrudActionConfig<
  CreateJustificationInput,
  CreateJustification
> = {
  inputTransformer: demuxCreateJustificationInput,
  responseErrorTransformer: muxCreateJustificationErrors,
  requestActionCreator: api.createJustification,
  requestSchema: CreateJustification,
};

export const CreateJustifiedSentenceConfig: EditorCommitCrudActionConfig<
  CreateJustifiedSentenceInput,
  CreateProposition | CreateStatement | CreateJustification
> = {
  inputTransformer(model: CreateJustifiedSentenceInput) {
    const { speakers, doCreateJustification, proposition } = model;
    if (speakers.length) {
      const statement = constructStatementInput(speakers, proposition);

      if (!doCreateJustification) {
        return statement as CreateStatement;
      }

      const justification = demuxCreateJustificationInput(model.justification);
      justification.target = {
        entity: statement,
        type: JustificationTargetTypes.STATEMENT,
      };
      return justification;
    }

    if (!doCreateJustification) {
      return proposition;
    }
    const justification = demuxCreateJustificationInput(model.justification);
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
  requestSchema: CreateProposition.or(CreateStatement).or(CreateJustification),
};

export const CreateCounterJustificationConfig: EditorCommitCrudActionConfig<
  CreateCounterJustificationInput,
  CreateCounterJustification
> = {
  inputTransformer: demuxCreateJustificationInput,
  responseErrorTransformer: muxCreateJustificationErrors,
  requestActionCreator: api.createCounterJustification,
  requestSchema: CreateCounterJustification,
};

export const CreateRegistrationConfirmationConfig: EditorCommitCrudActionConfig<
  CreateRegistrationConfirmationInput,
  CreateRegistrationConfirmation
> = {
  requestSchema: CreateRegistrationConfirmation,
  requestActionCreator: api.confirmRegistration,
};

export const CreateRegistrationRequestConfig: EditorCommitCrudActionConfig<
  CreateRegistrationRequestInput,
  CreateRegistrationRequest
> = {
  requestSchema: CreateRegistrationRequest,
  requestActionCreator: api.requestRegistration,
};

export const editorCommitConfigs: Partial<
  Record<EditorType, EditorCommitConfig>
> = {
  PROPOSITION: {
    // Create propositions through the JustifiedSentence endpoint.
    UPDATE: {
      requestActionCreator: api.updateProposition,
      requestSchema: UpdateProposition,
    },
  },
  JUSTIFIED_SENTENCE: {
    CREATE: CreateJustifiedSentenceConfig,
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
