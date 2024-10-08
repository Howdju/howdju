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
import forEach from "lodash/forEach";
import get from "lodash/get";
import has from "lodash/has";
import isNumber from "lodash/isNumber";
import isString from "lodash/isString";
import includes from "lodash/includes";
import merge from "lodash/merge";
import set from "lodash/set";
import {
  differenceWith,
  filter,
  isArray,
  isEqual,
  isFunction,
  keys,
  uniqWith,
} from "lodash";

import {
  apiErrorCodes,
  insertAt,
  makeCreatePersorg,
  makeUrl,
  newProgrammingError,
  removeAt,
  PropositionTagVotePolarities,
  tagEqual,
  Entity,
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
  UpdateAccountSettingsInput,
  CreateRegistrationConfirmationInput,
  CreatePropositionInput,
  CreateCounterJustificationInput,
  CreateProposition,
  PropositionTagVote,
  assert,
  UpdateWritQuoteInput,
  UpdateWritInput,
  CreateMediaExcerptInput,
  CreateMediaExcerpt,
  makeModelErrors,
  CreateSourceInput,
  UpdateSourceInput,
  CreatePersorgInput,
  UpdatePersorgInput,
  CreateUrlLocatorsInput,
  CreateUrlLocator,
  CreateAppearanceInput,
  CreateAppearance,
  PasswordResetConfirmation,
  CreatePasswordResetRequestInput,
  CreateMediaExcerptCitationsInput,
  CreateMediaExcerptSpeakersInput,
  Credentials,
} from "howdju-common";
import {
  api,
  str,
  clientNetworkErrorTypes,
  PayloadOf,
} from "howdju-client-common";

import {
  EditorActionCreator,
  EditorCommitActionCreator,
  editors,
  ListPathFactory,
} from "@/actions";
import { logger } from "@/logger";
import {
  EditorId,
  EditorCommitErrorPayload,
  ModelFactory,
  PropertyChanges,
} from "@/types";
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
  ACCOUNT_SETTINGS: "ACCOUNT_SETTINGS",
  APPEARANCE: "APPEARANCE",
  CONTENT_REPORT: "CONTENT_REPORT",
  COUNTER_JUSTIFICATION: "COUNTER_JUSTIFICATION",
  CREATE_URL_LOCATORS: "CREATE_URL_LOCATORS",
  CREATE_MEDIA_EXCERPT_CITATIONS: "CREATE_MEDIA_EXCERPT_CITATIONS",
  CREATE_MEDIA_EXCERPT_SPEAKERS: "CREATE_MEDIA_EXCERPT_SPEAKERS",
  JUSTIFICATION_BASIS_COMPOUND: "JUSTIFICATION_BASIS_COMPOUND",
  /* e.g. Proposition justification page */
  JUSTIFIED_SENTENCE: "JUSTIFIED_SENTENCE",
  LOGIN_CREDENTIALS: "LOGIN_CREDENTIALS",
  MEDIA_EXCERPT: "MEDIA_EXCERPT",
  /* e.g. new justification dialog */
  NEW_JUSTIFICATION: "NEW_JUSTIFICATION",
  PERSORG: "PERSORG",
  PROPOSITION: "PROPOSITION",
  REGISTRATION_CONFIRMATION: "REGISTRATION_CONFIRMATION",
  REGISTRATION_REQUEST: "REGISTRATION_REQUEST",
  SOURCE: "SOURCE",
  WRIT_QUOTE: "WRIT_QUOTE",
  PASSWORD_RESET_REQUEST: "PASSWORD_RESET_REQUEST",
  PASSWORD_RESET_CONFIRMATION: "PASSWORD_RESET_CONFIRMATION",
} as const;
export type EditorType = typeof EditorTypes[keyof typeof EditorTypes];

const blurredProp = "_blurred";
// Whether the user has interacted with a control
export type BlurredFields<T> = RecursiveObject<T, typeof blurredProp, boolean>;
const dirtyProp = "_dirty";
// Whether the user has changed the value of a control
export type DirtyFields<T> = RecursiveObject<T, typeof dirtyProp, boolean>;

const UNABLE_TO_INFER_MEDIA_EXCERPT_INFO_MESSAGE =
  "Unable to infer media excerpt info";
const UNABLE_TO_LOCATE_QUOTATION_MESSAGE =
  "Unable to locate the quotation (it may have a typo or the content may be pay-walled.)";

/**
 * Something we have an editor for.
 */
export type EditorEntity =
  | CreateContentReportInput
  | CreateCounterJustificationInput
  | CreateJustificationInput
  | CreateJustifiedSentenceInput
  | CreateMediaExcerptInput
  | CreatePropositionInput
  | CreateRegistrationRequestInput
  | CreateRegistrationConfirmationInput
  | CreateSourceInput
  | UpdateWritInput
  | CreateWritQuoteInput
  | UpdateWritQuoteInput
  | UpdateAccountSettingsInput
  | UpdateSourceInput
  | CreatePersorgInput
  | UpdatePersorgInput
  | CreateUrlLocatorsInput
  | CreateMediaExcerptCitationsInput
  | CreateMediaExcerptSpeakersInput
  | CreateAppearanceInput
  | CreatePasswordResetRequestInput
  | PasswordResetConfirmation;
/**
 * @typeparam T the editor model type.
 * @typeparam U the request model type.
 */
export interface EditorState<
  T extends EditorEntity,
  U = T,
  E extends ModelErrors<any> = ModelErrors<U>
> {
  isFetching: boolean;
  /**
   * The model the editor is editing.
   *
   * TODO(278) rename to editModel, since JustifiedSentence is not an entity.
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
    isFetching: false,
    editEntity: undefined,
    errors: undefined,
    isSaving: false,
    isSaved: false,
    blurredFields: undefined,
    dirtyFields: undefined,
    wasSubmitAttempted: false,
  } as EditorState<T, U>);

export interface AddListItemPayload {
  editorType: EditorType;
  editorId: EditorId;
  itemIndex: number;
  listPathMaker: ListPathFactory;
  itemFactory: () => Entity;
}

/** @deprecated TODO(523): replace with addListItem/removeListItem */
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

/** @deprecated TODO(83): replace with addListItem/removeListItem */
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
    (
      state: EditorState<any>,
      action: ReturnType<typeof editors.addListItem>
    ) => {
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
    (
      state: EditorState<any>,
      action: ReturnType<typeof editors.removeListItem>
    ) => {
      const { itemIndex, listPathMaker } = action.payload;
      const editEntity = state.editEntity;

      const listPath =
        isString(listPathMaker) || isArray(listPathMaker)
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
  [str(editors.replaceListItem)]: produce(
    (
      state: EditorState<any>,
      action: ReturnType<typeof editors.replaceListItem>
    ) => {
      const { itemIndex, listPathMaker, item } = action.payload;
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
      if (list.length <= itemIndex) {
        logger.error(
          `Cannot replace the ${itemIndex}th item from the list '${listPath}' because it does not exist.`
        );
        return;
      }
      list[itemIndex] = item;
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
    throw: produce(
      (state: EditorState<any>, action: Action<EditorCommitErrorPayload>) => {
        state.isSaving = false;

        const sourceError = action.payload.sourceError;
        if (
          sourceError.errorType !== clientNetworkErrorTypes.API_RESPONSE_ERROR
        ) {
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
              apiErrorCodes.UNAUTHORIZED,
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
      }
    ),
  },
  [str(editors.cancelEdit)]: (state: EditorState<any>) => ({
    ...state,
    ...defaultEditorState(),
  }),
  [str(editors.resetSubmission)]: () => defaultEditorState(),
};

interface EditorMeta {
  requestMeta?: any;
}
const defaultEditorReducer = handleActions<EditorState<any>, any>(
  defaultEditorActions as any,
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
  [EditorTypes.PROPOSITION]: handleActions<EditorState<any>, any, any>(
    {
      [str(api.fetchProposition)]: (state, action) => {
        const propositionId = get(state, "editEntity.id");
        if (propositionId === action.meta.propositionId) {
          return { ...state, isFetching: true };
        }
        return state;
      },
      [str(api.fetchProposition.response)]: (state, action) => {
        const propositionId = get(state, "editEntity.id");
        if (propositionId === action.meta.requestMeta.propositionId) {
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
            speakers: [makeCreatePersorg(), ...speakers],
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
        (list1, list2) => differenceWith(list1, list2, isEqual)
      ),
      [str(editors.inferMediaExcerptInfo)]: produce((state) => {
        if (
          state.editEntity &&
          state.editEntity.justification.basis.mediaExcerpt
        ) {
          state.isFetching = true;
        }
      }),
      [str(editors.inferMediaExcerptInfoSucceeded)]:
        inferMediaExcerptInfoSuccessHandler<CreateJustifiedSentenceInput>(
          "justification.basis.mediaExcerpt"
        ),
      [str(editors.inferMediaExcerptInfoFailed)]:
        inferMediaExcerptInfoFailureHandler<CreateJustifiedSentenceInput>(
          "justification.basis.mediaExcerpt"
        ),
    },
    defaultEditorState()
  ),

  CREATE_URL_LOCATORS: handleActions<
    EditorState<
      CreateUrlLocatorsInput,
      CreateUrlLocator[],
      ModelErrors<CreateUrlLocatorsInput>
    >,
    any
  >(
    {
      [str(editors.inferMediaExcerptInfo)]: produce((state) => {
        state.isFetching = true;
      }),
      [str(editors.inferMediaExcerptInfoSucceeded)]: produce(
        (
          state,
          action: Action<
            PayloadOf<typeof editors.inferMediaExcerptInfoSucceeded>
          >
        ) => {
          state.isFetching = false;

          const editEntity = state.editEntity;
          if (!editEntity) {
            logger.error("Cannot infer media excerpt info for absent entity.");
            return;
          }

          const { urlLocators } = editEntity;

          const { index, mediaExcerptInfo } = action.payload;
          const { anchors } = mediaExcerptInfo;

          if (anchors && urlLocators.length > 0) {
            urlLocators[index].anchors = anchors;

            // Remove the error if it exists
            if (
              state.errors &&
              "urlLocators" in state.errors &&
              state.errors.urlLocators?.[index]?.anchors?._errors
            ) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we just checked that it exists
              state.errors.urlLocators[index].anchors!._errors = [];
            }
          }
        }
      ),
      [str(editors.inferMediaExcerptInfoFailed)]: produce((state, action) => {
        state.isFetching = false;
        const { index } = action.payload;
        state.errors = merge(
          state.errors,
          makeModelErrors<CreateUrlLocatorsInput>((uli) =>
            uli.urlLocators[index].url.url(
              UNABLE_TO_INFER_MEDIA_EXCERPT_INFO_MESSAGE
            )
          )
        );
      }),
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
        if (writQuoteId === action.meta.writQuoteId) {
          return { ...state, isFetching: true };
        }
        return state;
      },
      [str(api.fetchWritQuote.response)]: (state, action) => {
        const writQuoteId = get(state, "editEntity.id");
        if (writQuoteId === action.meta.requestMeta.writQuoteId) {
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
          if (
            sourceError.errorType === clientNetworkErrorTypes.API_RESPONSE_ERROR
          ) {
            switch (get(sourceError, "body.errorCode")) {
              case apiErrorCodes.INVALID_LOGIN_CREDENTIALS: {
                return {
                  ...state,
                  errors: makeModelErrors<Credentials>((c) =>
                    c("Invalid login credentials")
                  ),
                  isSaving: false,
                };
              }
              case apiErrorCodes.USER_IS_INACTIVE_ERROR: {
                return {
                  ...state,
                  errors: makeModelErrors<Credentials>((c) =>
                    c("User is inactive")
                  ),
                  isSaving: false,
                };
              }
              case apiErrorCodes.VALIDATION_ERROR: {
                // TODO(279): remove typecast. CustomError should put custom props on a subfield
                // rather than on the whole field (`.body` comes from newApiResponseError.)
                const errors = (sourceError as any).body.errors.credentials;
                return { ...state, errors, isSaving: false };
              }
              default:
                return {
                  ...state,
                  errors: makeModelErrors<Credentials>((c) =>
                    c("User is inactive")
                  ),
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

  [EditorTypes.MEDIA_EXCERPT]: handleActions<
    EditorState<CreateMediaExcerptInput, CreateMediaExcerpt>,
    any
  >(
    {
      [str(editors.inferMediaExcerptInfo)]: produce((state) => {
        state.isFetching = true;
      }),
      [str(editors.inferMediaExcerptInfoSucceeded)]:
        inferMediaExcerptInfoSuccessHandler(),
      [str(editors.inferMediaExcerptInfoFailed)]:
        inferMediaExcerptInfoFailureHandler(),
    },
    defaultEditorState()
  ),

  APPEARANCE: handleActions<
    EditorState<CreateAppearanceInput, CreateAppearance>,
    any
  >({}, defaultEditorState()),
};

function inferMediaExcerptInfoSuccessHandler<T extends EditorEntity>(
  mediaExcerptPath?: string
) {
  return produce(
    (
      state: EditorState<T>,
      action: Action<PayloadOf<typeof editors.inferMediaExcerptInfoSucceeded>>
    ) => {
      state.isFetching = false;

      const editEntity = state.editEntity;
      if (!editEntity) {
        logger.error("Cannot infer media excerpt info for absent entity.");
        return;
      }
      const mediaExcerpt: CreateMediaExcerptInput = mediaExcerptPath
        ? get(editEntity, mediaExcerptPath)
        : editEntity;
      let mediaExcerptErrors: ModelErrors<CreateMediaExcerptInput> =
        mediaExcerptPath ? get(state.errors, mediaExcerptPath) : state.errors;

      const { index, mediaExcerptInfo } = action.payload;
      const { quotation, sourceDescription, anchors, authors } =
        mediaExcerptInfo;

      if (quotation) {
        mediaExcerpt.localRep.quotation = quotation;
      }

      if (
        mediaExcerpt.citations &&
        mediaExcerpt.citations.length > 0 &&
        !mediaExcerpt.citations[index].source.description
      ) {
        mediaExcerpt.citations[index].source.description = sourceDescription;
      }
      if (
        anchors &&
        mediaExcerpt.locators &&
        mediaExcerpt.locators.urlLocators.length > 0
      ) {
        mediaExcerpt.locators.urlLocators[index].anchors = anchors;

        // Remove the error if it exists
        if (
          mediaExcerptErrors?.locators &&
          "urlLocators" in mediaExcerptErrors.locators &&
          mediaExcerptErrors.locators.urlLocators?.[index].anchors?._errors
        ) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we just checked that it exists
          mediaExcerptErrors.locators.urlLocators[index].anchors!._errors = [];
        }
      }

      if (quotation && !anchors) {
        mediaExcerptErrors = merge(
          mediaExcerptErrors,
          makeModelErrors<CreateMediaExcerptInput>((me) =>
            me.locators.urlLocators[index].anchors(
              UNABLE_TO_LOCATE_QUOTATION_MESSAGE
            )
          )
        );
      }

      if (authors && (mediaExcerpt.speakers?.length ?? 0) < 1) {
        mediaExcerpt.speakers = authors.map((persorg) => ({ persorg }));
      }

      // Remove the error if it exists
      if (
        mediaExcerptErrors?.locators &&
        "urlLocators" in mediaExcerptErrors.locators &&
        mediaExcerptErrors.locators.urlLocators?.[index].url?.url?._errors
      ) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- we just checked that it exists
        mediaExcerptErrors.locators.urlLocators[index].url!.url!._errors = [];
      }

      if (mediaExcerptPath) {
        if (!state.errors) {
          state.errors = makeModelErrors<T>();
        }
        set(state.errors, mediaExcerptPath, mediaExcerptErrors);
      } else {
        state.errors = mediaExcerptErrors as ModelErrors<T>;
      }
    }
  );
}

function inferMediaExcerptInfoFailureHandler<T extends EditorEntity>(
  mediaExcerptPath?: string
) {
  return produce(
    (
      state: EditorState<T>,
      action: Action<PayloadOf<typeof editors.inferMediaExcerptInfoFailed>>
    ) => {
      state.isFetching = false;

      const { index } = action.payload;

      let mediaExcerptErrors: ModelErrors<CreateMediaExcerptInput> =
        mediaExcerptPath ? get(state.errors, mediaExcerptPath) : state.errors;

      mediaExcerptErrors = merge(
        mediaExcerptErrors,
        makeModelErrors<CreateMediaExcerptInput>((me) =>
          me.locators.urlLocators[index].url.url(
            UNABLE_TO_INFER_MEDIA_EXCERPT_INFO_MESSAGE
          )
        )
      );

      if (mediaExcerptPath) {
        if (!state.errors) {
          state.errors = makeModelErrors<T>();
        }
        set(state.errors, mediaExcerptPath, mediaExcerptErrors);
      } else {
        state.errors = mediaExcerptErrors as ModelErrors<T>;
      }
    }
  );
}

function makePropositionTagReducer(
  polarity: PropositionTagVotePolarity,
  combiner: (one: any[], two: any[]) => any[]
) {
  return (
    state: EditorState<CreateJustifiedSentenceInput>,
    action: AnyAction
  ) => {
    if (!state.editEntity || !("proposition" in state.editEntity)) {
      logger.error(
        "editEntity was missing or not a JustifiedSentence editEntity"
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
    const combinedTags = combiner(oldTags, [tag]);
    const uniqueTags = uniqWith(combinedTags, tagEqual);
    // See if the combiner actually changed anything. If not, just use the oldTags.
    let tags;
    if (uniqueTags.length === combinedTags.length) {
      tags = combinedTags;
    } else {
      tags = oldTags;
      assert(uniqueTags.length === oldTags.length);
    }

    if (
      tags === oldTags &&
      redundantPropositionTagVotes.length > 0 &&
      contradictoryPropositionTagVotes.length < 1
    ) {
      logger.debug(`Proposition is already tagged with ${tag}`);
      return state;
    }

    const propositionTagVotes: PropositionTagVote[] = combiner(
      oldPropositionTagVotes,
      [{ polarity, tag, proposition } as PropositionTagVote]
    );

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
type ReducerState = { [key in EditorType]?: EditorTypeState };

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
  const newState = isEditorAction
    ? handleEditorAction(state, action)
    : handleNonEditorAction(state, action);
  return newState;
};
