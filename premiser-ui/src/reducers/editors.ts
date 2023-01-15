import { AnyAction } from "redux";
import produce from "immer";
import { WritableDraft } from "immer/dist/internal";
import {
  Action,
  ActionMeta,
  handleActions,
  ReduxCompatibleReducerMeta,
} from "redux-actions";
import assign from "lodash/assign";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";
import concat from "lodash/concat";
import difference from "lodash/difference";
import find from "lodash/find";
import forEach from "lodash/forEach";
import get from "lodash/get";
import has from "lodash/has";
import isNumber from "lodash/isNumber";
import isString from "lodash/isString";
import includes from "lodash/includes";
import merge from "lodash/merge";
import set from "lodash/set";
import { filter, isFunction, keys } from "lodash";

import {
  apiErrorCodes,
  insertAt,
  makePersorg,
  makeUrl,
  newProgrammingError,
  removeAt,
  PropositionTagVotePolarities,
  tagEqual,
  Entity,
  ApiErrorCode,
  PropositionTagVotePolarity,
  WritQuote,
  RecursiveObject,
  CreateJustificationInput,
  makeCreatePropositionCompoundAtomInput,
  CustomError,
  ModelErrors,
  CreateJustifiedSentenceInput,
  makeCreateWritQuoteInput,
  CreateJustification,
  CreateWritQuoteInput,
  CreateJustifiedSentence,
  CreateRegistrationRequestInput,
  CreateRegistrationRequest,
  CreateContentReportInput,
  EditAccountSettingsInput,
  CreateRegistrationConfirmationInput,
  CreatePropositionInput,
  CreateCounterJustificationInput,
  CreateProposition,
} from "howdju-common";

import {
  api,
  EditorActionCreator,
  EditorCommitActionCreator,
  editors,
  ListPathFactory,
  str,
} from "@/actions";
import { UiErrorType, uiErrorTypes } from "@/uiErrors";
import {
  INVALID_LOGIN_CREDENTIALS,
  UNABLE_TO_LOGIN,
  USER_IS_INACTIVE_ERROR,
} from "@/texts";
import { logger } from "@/logger";
import { EditorId, ModelFactory, PropertyChanges } from "@/types";
import { combineObjectKey } from "@/viewModels";

type BooleanObject = { [key: string]: boolean };
const EditorActions: BooleanObject = {};
forEach(
  editors as { [key: string]: EditorActionCreator | EditorCommitActionCreator },
  (actionCreator: EditorActionCreator | EditorCommitActionCreator) => {
    EditorActions[str(actionCreator)] = true;
    // Include the result action too, if present
    if ("result" in actionCreator) {
      EditorActions[str(actionCreator.result)] = true;
    }
  }
);

export const EditorTypes = {
  PROPOSITION: "PROPOSITION",
  JUSTIFICATION_BASIS_COMPOUND: "JUSTIFICATION_BASIS_COMPOUND",
  WRIT_QUOTE: "WRIT_QUOTE",
  COUNTER_JUSTIFICATION: "COUNTER_JUSTIFICATION",
  /* e.g. new justification dialog */
  NEW_JUSTIFICATION: "NEW_JUSTIFICATION",
  /* e.g. Proposition justification page */
  JUSTIFIED_SENTENCE: "JUSTIFIED_SENTENCE",
  LOGIN_CREDENTIALS: "LOGIN_CREDENTIALS",
  REGISTRATION_REQUEST: "REGISTRATION_REQUEST",
  REGISTRATION_CONFIRMATION: "REGISTRATION_CONFIRMATION",
  PERSORG: "PERSORG",
  ACCOUNT_SETTINGS: "ACCOUNT_SETTINGS",
  CONTENT_REPORT: "CONTENT_REPORT",
} as const;
export type EditorType = typeof EditorTypes[keyof typeof EditorTypes];

const blurredProp = "_blurred";
// Whether the user has interacted with a control
export type BlurredFields<T> = RecursiveObject<T, typeof blurredProp, boolean>;
const dirtyProp = "_dirty";
// Whether the user has changed the value of a control
export type DirtyFields<T> = RecursiveObject<T, typeof dirtyProp, boolean>;

/**
 * Something we have an editor for.
 *
 * TODO: deduplicate this with *EditModels.
 */
export type EditorEntity =
  | CreatePropositionInput
  | CreateJustificationInput
  | CreateCounterJustificationInput
  | CreateJustifiedSentenceInput
  | CreateWritQuoteInput
  | EditAccountSettingsInput
  | CreateRegistrationRequestInput
  | CreateContentReportInput
  | CreateRegistrationConfirmationInput;
/**
 * @typeparam T the editor model type.
 * @typeparam U the request model type. TODO add FromInput<> mirroring ToInput.
 */
export interface EditorState<
  T extends EditorEntity,
  U = T,
  E extends ModelErrors<any> = ModelErrors<U>
> {
  /**
   * The model the editor is editing.
   *
   * TODO rename to editModel, since JustifiedSentence is not an entity.
   */
  editEntity?: T;
  blurredFields?: BlurredFields<T>;
  dirtyFields?: DirtyFields<T>;
  errors?: E;
  /** Whether the entity is in the middle of saving. */
  isSaving: boolean;
  /**
   * Whether the user has ever attempted a submit.
   *
   * Usually we want to show all errors for the form now, since otherwise the user may be confused
   * as to why their submit is blocked.
   */
  wasSubmitAttempted: boolean;
  /** Whether the entity has successfully saved. */
  isSaved: boolean;
}

export const defaultEditorState = <T extends EditorEntity, U = T>() =>
  ({
    editEntity: undefined,
    errors: undefined,
    isSaving: false,
    isSaved: false,
    blurredFields: undefined,
    dirtyFields: undefined,
    wasSubmitAttempted: false,
  } as EditorState<T, U>);

interface ErrorPayload {
  sourceError: {
    errorType: UiErrorType;
    body: {
      errorCode: ApiErrorCode;
      errors: { [key: string]: ModelErrors<any> };
    };
  };
}

export interface AddListItemPayload {
  editorType: EditorType;
  editorId: EditorId;
  itemIndex: number;
  listPathMaker: ListPathFactory;
  itemFactory: () => Entity;
}

/** @deprecated TODO(#83): replace with addListItem/removeListItem */
const makeAddAtomReducer =
  <T extends EditorEntity, U>(atomsPath: string, atomMaker: ModelFactory) =>
  (state: WritableDraft<EditorState<T, U>>, action: AnyAction) => {
    if (!state.editEntity) {
      logger.error("Cannot add atom to absent editEntity.");
      return;
    }
    const editEntity = state.editEntity;
    const atoms = get(editEntity, atomsPath);
    const index = isNumber(action.payload.index)
      ? action.payload.index
      : atoms.length;
    insertAt(atoms, index, atomMaker());
  };

/** @deprecated TODO(#83): replace with addListItem/removeListItem */
const makeRemoveAtomReducer =
  <T extends EditorEntity, U>(atomsPath: string) =>
  (state: WritableDraft<EditorState<T, U>>, action: AnyAction) => {
    if (!state.editEntity) {
      logger.error("Cannot remove atom from absent editEntity.");
      return;
    }
    const editEntity = state.editEntity;
    const atoms = get(editEntity, atomsPath);
    removeAt(atoms, action.payload.index);
  };

/** Reducers that separate the behavior from the state so that it is possible to have independent states updating according
 * to the same rules.  The editor type determines the rules that update the state, the editor type and editor ID identify
 * the state.
 */
const defaultEditorActions = {
  [str(editors.beginEdit)]: produce(
    (state: EditorState<any>, action: AnyAction) => {
      const { entity } = action.payload;
      state.editEntity = cloneDeep(entity);
      state.isSaved = false;
    }
  ),
  [str(editors.blurField)]: produce(
    (state: EditorState<any>, action: Action<{ fieldName: string }>) => {
      if (!state.blurredFields) {
        state.blurredFields = {};
      }
      set(
        state.blurredFields,
        combineObjectKey(action.payload.fieldName, blurredProp),
        true
      );
    }
  ),
  [str(editors.propertyChange)]: produce(
    (state: EditorState<any>, action: Action<PropertyChanges>) => {
      if (!state.editEntity) {
        logger.error("Cannot change a property of an absent editEntity.");
        return;
      }

      const properties = action.payload.properties;
      forEach(properties, (val, key) => {
        set(state.editEntity, key, val);
        if (!state.dirtyFields) {
          state.dirtyFields = {};
        }
        set(state.dirtyFields, combineObjectKey(key, dirtyProp), true);
      });
    }
  ),
  [str(editors.addListItem)]: produce(
    (state: EditorState<any>, action: Action<AddListItemPayload>) => {
      const { itemIndex, listPathMaker, itemFactory } = action.payload;
      const editEntity = state.editEntity;

      const listPath = isFunction(listPathMaker)
        ? listPathMaker(action.payload)
        : listPathMaker;
      if (!editEntity) {
        logger.error(
          `Cannot add an item to the list '${listPath}' because editEntity is missing.`
        );
        return;
      }
      const list = get(editEntity, listPath);
      const insertIndex = isNumber(itemIndex) ? itemIndex : list.length;
      insertAt(list, insertIndex, itemFactory());
    }
  ),
  [str(editors.removeListItem)]: produce(
    (state: EditorState<any>, action: AnyAction) => {
      const { itemIndex, listPathMaker } = action.payload;
      const editEntity = state.editEntity;

      const listPath = isString(listPathMaker)
        ? listPathMaker
        : listPathMaker(action.payload);
      if (!editEntity) {
        logger.error(
          `Cannot remove the ${itemIndex}th item from the list '${listPath}' because editEntity is missing.`
        );
        return;
      }
      const list = get(editEntity, listPath);
      removeAt(list, itemIndex);
    }
  ),
  [str(editors.attemptedSubmit)]: produce((state: EditorState<any>) => {
    state.wasSubmitAttempted = true;
  }),
  [str(editors.commitEdit)]: (state: EditorState<any>) => ({
    ...state,
    isSaving: true,
    errors: undefined,
    wasSubmitAttempted: true,
  }),
  [str(editors.commitEdit.result)]: {
    next: (state: EditorState<any>) => ({
      ...state,
      ...defaultEditorState(),
      isSaved: true,
    }),
    throw: produce((state: EditorState<any>, action: Action<ErrorPayload>) => {
      state.isSaving = false;

      const sourceError = action.payload.sourceError;
      if (sourceError.errorType !== uiErrorTypes.API_RESPONSE_ERROR) {
        return;
      }

      const responseBody = sourceError.body;
      if (
        !responseBody ||
        !includes(
          [
            apiErrorCodes.VALIDATION_ERROR,
            apiErrorCodes.ENTITY_CONFLICT,
            apiErrorCodes.USER_ACTIONS_CONFLICT,
            apiErrorCodes.AUTHORIZATION_ERROR,
          ],
          get(responseBody, "errorCode")
        )
      ) {
        return;
      }

      // For now, just remove any top-level errors.
      // TODO(26): figure out a rational way to handle translating entities to requests and
      // responses to entity errors.
      const errorKeys = filter(
        keys(responseBody.errors),
        (k) => k !== "_errors"
      );
      if (errorKeys.length !== 1) {
        // TODO(26): figure out an approach that automatically translates the response to the model
        // rather than assuming that the response errors has one field corresponding to the
        // editEntity.
        //
        // See EditorCommitCrudActionConfig.responseErrorTransformer.
        throw newProgrammingError(
          "The default reducer can only handle a single top-level error key"
        );
      }
      const errorKey = errorKeys[0];
      state.errors = responseBody.errors[errorKey];
    }),
  },
  [str(editors.cancelEdit)]: (state: EditorState<any>) => ({
    ...state,
    ...defaultEditorState(),
  }),
  [str(editors.resetSubmission)]: () => defaultEditorState(),
};

interface EditorMeta {
  requestPayload?: any;
}
const defaultEditorReducer = handleActions<EditorState<any>, any>(
  defaultEditorActions,
  defaultEditorState()
);
const editorReducerByType: {
  [key in EditorType]+?: ReduxCompatibleReducerMeta<
    EditorState<any>,
    any,
    EditorMeta
  >;
} = {
  // TODO(94): adopt Redux's slice pattern to get precise reducer typechecking
  [EditorTypes.PROPOSITION]: handleActions<EditorState<any>, any, EditorMeta>(
    {
      [str(api.fetchProposition)]: (state, action) => {
        const propositionId = get(state, "editEntity.id");
        if (propositionId === action.payload.propositionId) {
          return { ...state, isFetching: true };
        }
        return state;
      },
      [str(api.fetchProposition.response)]: (state, action) => {
        const propositionId = get(state, "editEntity.id");
        if (propositionId === action.meta.requestPayload.propositionId) {
          return { ...state, isFetching: false };
        }
        return state;
      },
    },
    defaultEditorState()
  ),

  [EditorTypes.COUNTER_JUSTIFICATION]: handleActions<EditorState<any>, any>(
    {
      [str(editors.addPropositionCompoundAtom)]: produce(
        makeAddAtomReducer(
          "basis.propositionCompound.atoms",
          makeCreatePropositionCompoundAtomInput
        )
      ),
      [str(editors.removePropositionCompoundAtom)]: produce(
        makeRemoveAtomReducer("basis.propositionCompound.atoms")
      ),
    },
    defaultEditorState()
  ),

  [EditorTypes.NEW_JUSTIFICATION]: handleActions<
    EditorState<CreateJustificationInput, CreateJustification>,
    any
  >(
    {
      [str(editors.addUrl)]: produce((state) => {
        const basis = state.editEntity?.basis;
        if (!basis) {
          logger.error("Cannot add URL to absent edit entity.");
          return;
        }
        if (!("urls" in basis.writQuote)) {
          basis.writQuote = makeCreateWritQuoteInput(basis.writQuote);
        }
        basis.writQuote.urls.push(makeUrl());
      }),
      [str(editors.removeUrl)]: produce((state, action) => {
        const basis = state.editEntity?.basis;
        if (!basis) {
          logger.error("Cannot remove URL from absent edit entity.");
          return;
        }
        if (!("urls" in basis.writQuote)) {
          logger.error(
            "Unable to remove URL from justification's WritQuote because it is a Ref."
          );
          return;
        }

        removeAt(basis.writQuote.urls, action.payload.index);
      }),
      [str(editors.addPropositionCompoundAtom)]: produce(
        makeAddAtomReducer(
          "basis.propositionCompound.atoms",
          makeCreatePropositionCompoundAtomInput
        )
      ),
      [str(editors.removePropositionCompoundAtom)]: produce(
        makeRemoveAtomReducer("basis.propositionCompound.atoms")
      ),
    },
    defaultEditorState<any>()
  ),

  [EditorTypes.JUSTIFIED_SENTENCE]: handleActions<
    EditorState<
      CreateJustifiedSentenceInput,
      CreateJustifiedSentence,
      ModelErrors<CreateProposition | CreateJustification>
    >,
    any
  >(
    {
      [str(editors.addSpeaker)]: (state) => {
        const editEntity = state.editEntity;
        if (!editEntity) {
          logger.error("Cannot add speaker to an absent editEntity.");
          return state;
        }
        const speakers = editEntity.speakers;
        return assign({}, state, {
          editEntity: {
            ...editEntity,
            speakers: [makePersorg(), ...speakers],
          },
        });
      },
      [str(editors.removeSpeaker)]: (state, action) => {
        const editEntity = state.editEntity;
        if (!editEntity) {
          logger.error("Cannot remove speaker from an absent editEntity.");
          return state;
        }
        const speakers = clone(editEntity.speakers);
        removeAt(speakers, action.payload.index);
        return assign({}, state, {
          editEntity: {
            ...editEntity,
            speakers,
          },
        });
      },
      [str(editors.replaceSpeaker)]: (state, action) => {
        const editEntity = state.editEntity;
        if (!editEntity) {
          logger.error("Cannot replace speaker of an absent editEntity.");
          return state;
        }
        const speakers = clone(editEntity.speakers);
        speakers[action.payload.index] = action.payload.speaker;
        return assign({}, state, {
          editEntity: {
            ...editEntity,
            speakers,
          },
        });
      },
      [str(editors.addUrl)]: (state) => {
        const editEntity = state.editEntity;
        if (!editEntity) {
          logger.error("Cannot add URL to an absent editEntity.");
          return state;
        }
        let writQuote = { ...editEntity.justification.basis.writQuote };
        if (!("urls" in writQuote)) {
          writQuote = makeCreateWritQuoteInput(writQuote);
        }
        writQuote.urls = writQuote.urls.concat([makeUrl()]);
        return merge(
          { ...state },
          { editEntity: { justification: { basis: { writQuote } } } }
        );
      },
      [str(editors.removeUrl)]: (state, action) => {
        if (!state.editEntity) {
          logger.error("Cannot remove URL from an absent editEntity.");
          return state;
        }
        const editEntity = {
          ...state.editEntity,
        };

        if (!("urls" in editEntity.justification.basis.writQuote)) {
          logger.error(
            "Unable to remove URL from Justification's WritQuote because it is a Ref."
          );
          return state;
        }

        const urls = clone(editEntity.justification.basis.writQuote.urls);
        removeAt(urls, action.payload.index);
        editEntity.justification.basis.writQuote.urls = urls;

        return { ...state, editEntity };
      },
      [str(editors.addPropositionCompoundAtom)]: produce(
        makeAddAtomReducer(
          "justification.basis.propositionCompound.atoms",
          makeCreatePropositionCompoundAtomInput
        )
      ),
      [str(editors.removePropositionCompoundAtom)]: produce(
        makeRemoveAtomReducer("justification.basis.propositionCompound.atoms")
      ),

      [str(editors.tagProposition)]: makePropositionTagReducer(
        PropositionTagVotePolarities.POSITIVE,
        concat
      ),
      [str(editors.unTagProposition)]: makePropositionTagReducer(
        PropositionTagVotePolarities.POSITIVE,
        difference
      ),
    },
    defaultEditorState()
  ),

  [EditorTypes.WRIT_QUOTE]: handleActions<EditorState<any>, any, any>(
    {
      [str(editors.addUrl)]: (state) => {
        const editEntity = { ...state.editEntity } as WritQuote;
        editEntity.urls = editEntity.urls.concat([makeUrl()]);
        return { ...state, editEntity };
      },
      [str(editors.removeUrl)]: (state, action) => {
        const editEntity = { ...state.editEntity } as WritQuote;

        const urls = clone(editEntity.urls);
        removeAt(urls, action.payload.index);
        editEntity.urls = urls;

        return { ...state, editEntity };
      },
      [str(api.fetchWritQuote)]: (state, action) => {
        const writQuoteId = get(state, "editEntity.id");
        if (writQuoteId === action.payload.writQuoteId) {
          return { ...state, isFetching: true };
        }
        return state;
      },
      [str(api.fetchWritQuote.response)]: (state, action) => {
        const writQuoteId = get(state, "editEntity.id");
        if (writQuoteId === action.meta.requestPayload.writQuoteId) {
          return { ...state, isFetching: false };
        }
        return state;
      },
    },
    defaultEditorState()
  ),

  [EditorTypes.LOGIN_CREDENTIALS]: handleActions<EditorState<any>, any>(
    {
      [str(editors.commitEdit.result)]: {
        throw: (state, action) => {
          const sourceError: CustomError = action.payload.sourceError;
          if (sourceError.errorType === uiErrorTypes.API_RESPONSE_ERROR) {
            switch (get(sourceError, "body.errorCode")) {
              case apiErrorCodes.INVALID_LOGIN_CREDENTIALS: {
                return {
                  ...state,
                  errors: {
                    credentials: { modelErrors: [INVALID_LOGIN_CREDENTIALS] },
                  },
                  isSaving: false,
                };
              }
              case apiErrorCodes.USER_IS_INACTIVE_ERROR: {
                return {
                  ...state,
                  errors: {
                    credentials: { modelErrors: [USER_IS_INACTIVE_ERROR] },
                  },
                  isSaving: false,
                };
              }
              case apiErrorCodes.VALIDATION_ERROR: {
                // TODO: remove typecast. CustomError should put custom props on a subfield
                // rather than on the whole field (`.body` comes from newApiResponseError.)
                const errors = (sourceError as any).body.errors.credentials;
                return { ...state, errors, isSaving: false };
              }
              default:
                return {
                  ...state,
                  errors: { credentials: { modelErrors: [UNABLE_TO_LOGIN] } },
                  isSaving: false,
                };
            }
          }

          return { ...state, isSaving: false };
        },
      },
    },
    defaultEditorState()
  ),

  [EditorTypes.REGISTRATION_REQUEST]: handleActions<
    EditorState<CreateRegistrationRequestInput, CreateRegistrationRequest>,
    any
  >(
    {
      [str(editors.commitEdit.result)]: {
        next: (state, action) => ({
          ...state,
          duration: action.payload.result.duration,
          isSaving: false,
          isSaved: true,
        }),
      },
    },
    defaultEditorState()
  ),
};

type Combiner = (one: Array<unknown>, two: Array<unknown>) => Array<unknown>;
function makePropositionTagReducer(
  polarity: PropositionTagVotePolarity,
  combiner: Combiner
) {
  return (
    state: EditorState<CreateJustifiedSentenceInput>,
    action: AnyAction
  ) => {
    if (!state.editEntity || !("proposition" in state.editEntity)) {
      logger.error(
        "editEntity was missing or not a PropositionJustificationsEditEntity"
      );
      return state;
    }
    const editEntity = state.editEntity;
    const proposition = editEntity.proposition;
    const { tag } = action.payload;

    const oldPropositionTagVotes = get(proposition, "propositionTagVotes", []);
    const redundantPropositionTagVotes = [],
      contradictoryPropositionTagVotes = [];
    forEach(oldPropositionTagVotes, (vote) => {
      if (vote.proposition.id === proposition.id && tagEqual(vote.tag, tag)) {
        if (vote.polarity === polarity) {
          redundantPropositionTagVotes.push(vote);
        } else {
          contradictoryPropositionTagVotes.push(vote);
        }
      }
    });

    const oldTags = get(proposition, "tags", []);
    const existingTag = find(oldTags, (oldTag) => tagEqual(oldTag, tag));
    const tags = existingTag ? oldTags : combiner(oldTags, [tag]);

    if (
      tags === oldTags &&
      redundantPropositionTagVotes.length > 0 &&
      contradictoryPropositionTagVotes.length < 1
    ) {
      logger.debug(`Proposition is already tagged with ${tag}`);
      return state;
    }

    const propositionTagVotes =
      redundantPropositionTagVotes.length > 0
        ? oldPropositionTagVotes
        : combiner(oldPropositionTagVotes, [{ polarity, tag, proposition }]);

    return {
      ...state,
      editEntity: {
        ...state.editEntity,
        proposition: { ...proposition, tags, propositionTagVotes },
      },
    };
  };
}

type EditorTypeState = { [key: EditorId]: EditorState<any> };
// The editor reducer state is a two-level map: editorType -> editorId -> editorState
type ReducerState = { [key in EditorType]: EditorTypeState };

interface EditorPayload {
  editorType: EditorType;
  editorId: EditorId;
}
const handleEditorAction = (
  state: ReducerState,
  action: ActionMeta<EditorPayload, EditorMeta>
) => {
  const { editorType, editorId } = action.payload;

  if (!editorType) {
    throw newProgrammingError("editorType is required");
  }
  if (!editorId) {
    throw newProgrammingError("editorId is required");
  }

  // editorState could be undefined
  const editorState = get(state, [editorType, editorId], defaultEditorState());
  const editorReducer = editorReducerByType[editorType];
  let newEditorState = editorReducer
    ? editorReducer(editorState, action)
    : editorState;
  if (newEditorState === editorState) {
    // If the type-specific editor reducer didn't update the state, give the default reducer a crack at it
    // Basically we would like to be able to define default behavior for the editor actions in one place
    // If a type-specific editor reducer wants to override this behavior to do nothing, it can do
    // [actionType]: (state) => ({...state})
    newEditorState = defaultEditorReducer(editorState, action);
  }
  return editorState === newEditorState
    ? state
    : assign({}, state, {
        [editorType]: assign({}, state[editorType], {
          [editorId]: newEditorState,
        }),
      });
};

const handleNonEditorAction = (
  state: ReducerState,
  action: ActionMeta<any, EditorMeta>
) => {
  let stateHasChanged = false;
  const nextState = {} as ReducerState;
  for (const editorType in EditorTypes) {
    const editorStates = state[editorType as EditorType];
    // The same editor applies to all states within its key
    const editorReducer = editorReducerByType[editorType as EditorType];
    let editorTypeStateHasChanged = false;
    const nextEditorTypeStates: EditorTypeState = {};
    forEach(editorStates, (editorState, editorId) => {
      const nextEditorState = editorReducer
        ? editorReducer(editorState, action)
        : editorState;
      // Don't check the defaultEditorReducer for non-editor actions
      const editorStateHasChanged = nextEditorState !== editorState;
      editorTypeStateHasChanged =
        editorTypeStateHasChanged || editorStateHasChanged;
      nextEditorTypeStates[editorId] = editorStateHasChanged
        ? nextEditorState
        : editorState;
    });
    stateHasChanged = stateHasChanged || editorTypeStateHasChanged;
    nextState[editorType as EditorType] = editorTypeStateHasChanged
      ? nextEditorTypeStates
      : editorStates;
  }

  return stateHasChanged ? nextState : state;
};

export default (
  state: ReducerState = {} as ReducerState,
  action: ActionMeta<any, EditorMeta>
) => {
  const isEditorAction = has(EditorActions, action.type);
  if (isEditorAction) {
    return handleEditorAction(state, action);
  } else {
    return handleNonEditorAction(state, action);
  }
};
