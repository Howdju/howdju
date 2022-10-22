import {
  ActionFunctionAny,
  combineActions as untypedCombineActions,
} from "redux-actions";
import reduce from "lodash/reduce";
import mapValues from "lodash/mapValues";
import assign from "lodash/assign";
import {
  ActionCreatorsMapObject,
  PayloadActionCreator,
  createAction as toolkitCreateAction,
  PrepareAction,
  ActionCreatorWithPayload,
} from "@reduxjs/toolkit";
import { Location } from "history";
import { Action, bindActionCreators } from "redux";
import { schema } from "normalizr";

import {
  EntityId,
  JustificationVotePolarities,
  PropositionTagVotePolarities,
  WritQuote,
  JustificationRootTargetType,
  Proposition,
  JustificationRootTarget,
  Persorg,
  Url,
  PropositionCompoundAtom,
  Tag,
  Statement,
  Justification,
  JustificationBasisSourceType,
  Persisted,
  PropositionTagVote,
  makePropositionTagVoteSubmissionModel,
  JustificationRootTargetTypes,
  httpMethods,
  HttpMethod,
  JustificationRootTargetInfo,
} from "howdju-common";
import {
  actions,
  Source,
  Target,
  ExtensionAnnotationContent,
} from "howdju-client-common";

import { EditorEntity, EditorType } from "./reducers/editors";
import { AppDispatch } from "./store";
import {
  ContextTrailItemInfo,
  PrivacyConsentCookie,
  PropertyChanges,
  SuggestionsKey,
  WidgetId,
  EditorId,
} from "./types";
import { justificationSchema, propositionSchema, statementSchema } from "./normalizationSchemas";

const actionTypeDelim = "/";

export const str = actions.str;

// redux-action's combineActions return value is not recognized as a valid object key.
// So provide this typed version instead.
export const combineActions = untypedCombineActions as (
  ...actionTypes: Array<ActionFunctionAny<Action<string>> | string | symbol>
) => any;

/**
 * Helper to bind action creator groups to dispatch for redux-react's connect method.
 *
 * Action groups are what we call the objects below with react-actions action creators.  They are just
 * a way to organize related action creators.  The convention with redux-react's connect method's mapDispatchToProps
 * is to pass an object with keys equal to action creators.  redux-react will automatically turn the action creators
 * into dispatched versions.  This helper accomplishes the same for an object the properties of which are action creator
 * groups like those defined below.
 *
 * @param actionCreatorGroups a map of action creator groups that will be bound by the name of the
 *   action creator group on the returned value.
 * @param otherActions a map of ActionCreators that will be bound to dispatch directly on the
 *   returned value.
 */
export const mapActionCreatorGroupToDispatchToProps =
  <M extends object, N>(actionCreatorGroups: M, otherActions?: N) =>
  (dispatch: AppDispatch): M & N => {
    const dispatchingProps = mapValues(
      actionCreatorGroups,
      (actionCreatorGroup: ActionCreatorsMapObject<any>) =>
        bindActionCreators(actionCreatorGroup, dispatch)
    ) as { [P in keyof M]: M[P] } & { [P in keyof N]: N[P] };

    if (otherActions) {
      assign(dispatchingProps, bindActionCreators(otherActions, dispatch));
    }

    return dispatchingProps;
  };

// The terminology around redux actions is terrible.
//
// `createAction`: a reduxjs/toolkit helper returning an ActionCreator
// `ActionCreator`: a factory for functions that create actions. Really an ActionCreatorFactory.

/**
 * ApiActionCreator types must be strings because we generate them.
 *
 * @typeparam P payload type
 * @typeparam RP response payload type
 * @typeparam PA prepare action type
 */
type ApiActionCreator<
  P,
  RP,
  PA extends void | PrepareAction<P>
> = PayloadActionCreator<P, string, PA> & {
  response: ActionCreatorWithPayload<RP, string>;
};

const makeApiActionTypes = (type: string) => {
  const requestType = "API" + actionTypeDelim + type;
  const responseType = requestType + actionTypeDelim + "RESPONSE";
  return [requestType, responseType];
};

export type ApiActionMeta<P = any> = {
  normalizationSchema: any;
  requestPayload: P;
};

/**
 * Helper to create a reduxjs/toolkit prepare method that is compatible with redux-actions syle calls.
 *
 * redux-actions's `handleActions` helper accepts separate `next` and `throw` reducers. It will call
 * the `throw` reducer if the action's `error` field `=== true`.
 * (https://github.com/redux-utilities/redux-actions/blob/4bd68b11b841718e64999d214544d6a87337644e/src/handleAction.js#L33)
 */
function reduxActionsCompatiblePrepare<P>(
  prepare: PrepareAction<P>
): PrepareAction<P> {
  return function (...args: any[]) {
    const prepared = prepare(...args)
    if (prepared.payload instanceof Error) {
      return {
        ...prepared,
        error: true,
      };
    }
    return prepared;
  };
}

/**
 * A createAction that translates our calling convention to the reduxjs/toolkit convention.
 *
 * The reduxjs/toolkit calling convention is to pass a single `prepare` method that must return an
 * object like `{payload, meta?, error?}`.
 *
 * Since our app uses the convention of invoking action creators with multiple positional arguments
 * that are translated into a payload, reduxjs./toolkit's convention would add a lot of verbose
 * boilerplate like:
 *
 * ```
 * createAction('THE_ACTION_TYPE', (arg1, arg2) => ({payload: {arg1, arg2}}))
 * ```
 *
 * as opposed to:
 *
 * ```
 * createAction('THE_ACTION_TYPE', (arg1, arg2) => ({arg1, arg2}))
 * ```
 *
 * (where we can omit the `payload` field.)
 *
 * To avoid the boilerplate, we adopt a createAction callling convention accepting a
 * payloadCreatorOrPrepare function. If this function returns an object containing a `payload`
 * field, then the return value is used directly as the prepared value. Otherwise, the return value
 * is used as the `payload` of a new prepared object.
 *
 * One consequence of this is that, in the unlikely event that the payload should contain a field
 * called payload, then the payloadCreatorOrPrepare function should return a fully prepared object like:
 *
 * ```json
 * {payload: {payload: {...}}}
 * ```
 */
function createAction<T extends string, P>(
  type: T,
  payloadCreatorOrPrepare?: (...args: any[]) => P | {payload: P, meta?: any},
) {
  const prepare = payloadCreatorOrPrepare && function prepare(...args: any[]) {
    let prepared = payloadCreatorOrPrepare(...args)
    if (!('payload' in prepared)) {
      prepared = {payload: prepared}
    }
    return prepared
  }
  if (prepare) {
    return toolkitCreateAction(type, reduxActionsCompatiblePrepare(prepare));
  }
  return toolkitCreateAction(type);
}

/**
 * @typeparam N the type of the normalization schema
 */
interface ResourceApiConfig<N> {
  endpoint: string
  normalizationSchema: N
  fetchInit?: {
    method: HttpMethod
    body?: any
  }
  canSkipRehydrate?: boolean
  cancelKey?: string
}

/**
 * Converts a normalizr schema into a response payload.
 *
 * Replaces the schemas with their generic entity type.
 *
 * For example, given this schema:
 *
 * ```typescript
 * const someSchema: {
 *   proposition: schema.Entity<Proposition>;
 *   example: {
 *       justification: schema.Entity<Justification>;
 *   };
 * }
 * ```
 *
 * `ExtractSchemaEntity<typeof someSchema>` will be:
 *
 * ```typescript
 * type someSchemaEntities = {
 *   proposition: Proposition;
 *   example: {
 *       justification: Justification;
 *   };
 * }
 * ```
 */
type ExtractSchemaEntity<S> = S extends schema.Entity<infer E> ? E : {
  [Key in keyof S]: ExtractSchemaEntity<S[Key]>
}

/**
 * Create an action creator having a property `.response` with another action creator for corresponding API responses
 *
 * @typeparam P the payload type
 * @typeparam N the type of the normalization schema
 * @typeparam RP the response payload type
 * @typeparam PA the prepare function type
 */
function apiActionCreator<P, N, PA extends (...args: any[]) => { payload: P }>(
  type: string,
  payloadCreatorOrPrepare?: (...args: any[]) => P | {payload: P, meta?: any},
  apiConfigCreator?: (p: P) => ResourceApiConfig<N>
): ApiActionCreator<P, ExtractSchemaEntity<N>, PA> {
  const [requestType, responseType] = makeApiActionTypes(type);

  // Add apiConfig to meta
  const requestPrepare = payloadCreatorOrPrepare && function requestPrepare(...args: any[]) {
    let prepared = payloadCreatorOrPrepare(...args)
    if (apiConfigCreator) {
      if(!('payload' in prepared)) {
        prepared = {payload: prepared, meta: {}}
      } else if (!prepared.meta) {
        prepared.meta = {}
      }
      prepared.meta.apiConfig = apiConfigCreator(prepared.payload)
    }
    return prepared
  }

  const ac = createAction(
    requestType,
    requestPrepare,
  ) as ApiActionCreator<P, ExtractSchemaEntity<N>, PA>;
  ac.response = createAction(
    responseType,
    (payload: ExtractSchemaEntity<N>, meta: ApiActionMeta<P>) => ({payload, meta}),
  ) as ActionCreatorWithPayload<ExtractSchemaEntity<N>, string>;
  return ac;
}

export const app = {
  searchMainSearch: createAction(
    "APP/SEARCH_MAIN_SEARCH",
    (searchText: string) => ({ searchText })
  ),
  clearAuthToken: createAction("APP/CLEAR_AUTH_TOKEN"),
  checkAuthExpiration: createAction("APP/CHECK_AUTH_EXPIRATION"),
};

const rootTargetEndpointsByType = {
  [JustificationRootTargetTypes.PROPOSITION]: {
    endpoint: 'propositions',
    normalizationSchema: {proposition: propositionSchema},
  },
  [JustificationRootTargetTypes.STATEMENT]: {
    endpoint: 'statements',
    normalizationSchema: {statement: statementSchema},
  },
  [JustificationRootTargetTypes.JUSTIFICATION]: {
    endpoint: 'statements',
    normalizationSchema: {justification: justificationSchema},
  },
}

/** Actions that directly result in API calls */
export const api = {
  callApi: apiActionCreator("CALL_API"),
  fetchProposition: apiActionCreator(
    "FETCH_PROPOSITION",
    (propositionId: EntityId) => ({ propositionId })
  ),
  fetchPropositions: apiActionCreator(
    "FETCH_PROPOSITIONS",
    (propositionIds: EntityId[]) => ({ propositionIds })
  ),
  fetchPropositionCompound: apiActionCreator(
    "FETCH_PROPOSITION_COMPOUND",
    (propositionCompoundId: EntityId) => ({ propositionCompoundId })
  ),
  fetchRootJustificationTarget: apiActionCreator(
    "FETCH_ROOT_JUSTIFICATION_TARGET",
    (rootTargetType: JustificationRootTargetType, rootTargetId: EntityId): JustificationRootTargetInfo => ({
      rootTargetType,
      rootTargetId,
    }),
    ({
      rootTargetType,
      rootTargetId,
    }) => {
      const {endpoint, normalizationSchema} = rootTargetEndpointsByType[rootTargetType]
      return {
        endpoint: `${endpoint}/${rootTargetId}?include=justifications`,
        fetchInit: {
          method: httpMethods.GET,
        },
        normalizationSchema,
      }
    }
  ),

  fetchWritQuote: apiActionCreator(
    "FETCH_WRIT_QUOTE",
    (writQuoteId: EntityId) => ({ writQuoteId })
  ),
  createWritQuote: apiActionCreator(
    "CREATE_WRIT_QUOTE",
    (writQuote: WritQuote) => ({ writQuote })
  ),
  updateWritQuote: apiActionCreator(
    "UPDATE_WRIT_QUOTE",
    (writQuote: WritQuote) => ({ writQuote })
  ),

  fetchSourceExcerptParaphrase: apiActionCreator(
    "FETCH_SOURCE_EXCERPT_PARAPHRASE",
    (sourceExcerptParaphraseId) => ({ sourceExcerptParaphraseId })
  ),
  fetchPersorg: apiActionCreator("FETCH_PERSORG", (persorgId) => ({
    persorgId,
  })),
  fetchSpeakerStatements: apiActionCreator(
    "FETCH_PERSORG_STATEMENTS",
    (speakerPersorgId) => ({ speakerPersorgId })
  ),
  fetchSentenceStatements: apiActionCreator(
    "FETCH_SENTENCE_STATEMENTS",
    (sentenceType, sentenceId) => ({ sentenceType, sentenceId })
  ),
  fetchRootPropositionStatements: apiActionCreator(
    "FETCH_ROOT_PROPOSITION_STATEMENTS",
    (propositionId) => ({ propositionId })
  ),
  fetchIndirectPropositionStatements: apiActionCreator(
    "FETCH_INDIRECT_PROPOSITION_STATEMENTS",
    (propositionId) => ({ propositionId })
  ),

  fetchRecentPropositions: apiActionCreator(
    "FETCH_RECENT_PROPOSITIONS",
    (widgetId, count, continuationToken) => ({
      widgetId,
      count,
      continuationToken,
    })
  ),
  fetchRecentWrits: apiActionCreator(
    "FETCH_RECENT_WRITS",
    (widgetId, count, continuationToken) => ({
      widgetId,
      continuationToken,
      count,
    })
  ),
  fetchRecentWritQuotes: apiActionCreator(
    "FETCH_RECENT_WRIT_QUOTES",
    (widgetId, count, continuationToken) => ({
      widgetId,
      count,
      continuationToken,
    })
  ),
  fetchRecentJustifications: apiActionCreator(
    "FETCH_RECENT_JUSTIFICATIONS",
    (widgetId, count, continuationToken) => ({
      widgetId,
      count,
      continuationToken,
    })
  ),

  fetchFeaturedPerspectives: apiActionCreator(
    "FETCH_FEATURED_PERSPECTIVES",
    (widgetId) => ({ widgetId })
  ),

  createAccountSettings: apiActionCreator(
    "CREATE_ACCOUNT_SETTINGS",
    (accountSettings) => ({ accountSettings })
  ),
  fetchAccountSettings: apiActionCreator("FETCH_ACCOUNT_SETTINGS"),
  updateAccountSettings: apiActionCreator(
    "UPDATE_ACCOUNT_SETTINGS",
    (accountSettings) => ({ accountSettings })
  ),

  createContentReport: apiActionCreator(
    "CREATE_CONTENT_REPORT",
    (contentReport) => ({ contentReport })
  ),

  fetchJustificationsSearch: apiActionCreator(
    "FETCH_JUSTIFICATIONS_SEARCH",
    ({ filters, includeUrls, count, continuationToken }) => ({
      filters,
      includeUrls,
      count,
      continuationToken,
    })
  ),
  login: apiActionCreator("LOGIN", (credentials) => ({ credentials })),
  logout: apiActionCreator("LOGOUT"),

  requestPasswordReset: apiActionCreator(
    "REQUEST_PASSWORD_RESET",
    (passwordResetRequest) => ({ passwordResetRequest })
  ),
  checkPasswordResetRequest: apiActionCreator(
    "CHECK_PASSWORD_RESET_REQUEST",
    (passwordResetCode) => ({ passwordResetCode })
  ),
  confirmPasswordReset: apiActionCreator(
    "CONFIRM_PASSWORD_RESET",
    (passwordResetCode, passwordResetConfirmation) => ({
      passwordResetCode,
      passwordResetConfirmation,
    })
  ),

  requestRegistration: apiActionCreator(
    "REQUEST_REGISTRATION",
    (registrationRequest) => ({ registrationRequest })
  ),
  checkRegistration: apiActionCreator(
    "CHECK_REGISTRATION",
    (registrationCode) => ({ registrationCode })
  ),
  confirmRegistration: apiActionCreator(
    "CONFIRM_REGISTRATION",
    (registrationConfirmation) => ({ registrationConfirmation })
  ),

  verifyJustification: apiActionCreator(
    "VERIFY_JUSTIFICATION",
    (justification) => ({
      justificationVote: {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.POSITIVE,
      },
      previousJustificationVote: justification.vote,
    })
  ),
  unVerifyJustification: apiActionCreator(
    "UN_VERIFY_JUSTIFICATION",
    (justification) => ({
      justificationVote: {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.POSITIVE,
      },
      previousJustificationVote: justification.vote,
    })
  ),
  disverifyJustification: apiActionCreator(
    "DISVERIFY_JUSTIFICATION",
    (justification) => ({
      justificationVote: {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.NEGATIVE,
      },
      previousJustificationVote: justification.vote,
    })
  ),
  unDisverifyJustification: apiActionCreator(
    "UN_DISVERIFY_JUSTIFICATION",
    (justification) => ({
      justificationVote: {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.NEGATIVE,
      },
      previousJustificationVote: justification.vote,
    })
  ),

  createTag: apiActionCreator(
    "CREATE_TAG",
    (tagTagetType, tagTargetId, tag, tagVote) => ({
      tagTagetType,
      tagTargetId,
      tag,
      tagVote,
    })
  ),
  createAntiTag: apiActionCreator(
    "CREATE_ANTI_TAG",
    (tagTagetType, tagTargetId, tag, tagVote) => ({
      tagTagetType,
      tagTargetId,
      tag,
      tagVote,
    })
  ),
  unTag: apiActionCreator("UN_TAG", (tagVote) => ({ tagVote })),

  tagProposition: apiActionCreator(
    "TAG_PROPOSITION",
    (
      propositionId: EntityId,
      tag: Tag,
      propositionTagVote: PropositionTagVote
    ) => ({
      propositionTagVote: makePropositionTagVoteSubmissionModel({
        polarity: PropositionTagVotePolarities.POSITIVE,
        proposition: { id: propositionId },
        tag,
      }),
      prevPropositionTagVote: propositionTagVote,
    })
  ),
  antiTagProposition: apiActionCreator(
    "ANTI_TAG_PROPOSITION",
    (propositionId, tag, propositionTagVote) => ({
      propositionTagVote: makePropositionTagVoteSubmissionModel({
        polarity: PropositionTagVotePolarities.NEGATIVE,
        proposition: { id: propositionId },
        tag,
      }),
      prevPropositionTagVote: propositionTagVote,
    })
  ),
  unTagProposition: apiActionCreator(
    "UN_TAG_PROPOSITION",
    (propositionTagVote: Persisted<PropositionTagVote>) => ({
      prevPropositionTagVote: propositionTagVote,
    })
  ),

  createProposition: apiActionCreator("CREATE_PROPOSITION", (proposition) => ({
    proposition,
  })),
  updateProposition: apiActionCreator(
    "UPDATE_PROPOSITION",
    (proposition: Proposition) => ({ proposition }),
  ),
  deleteProposition: apiActionCreator("DELETE_PROPOSITION", (proposition) => ({
    proposition,
  })),

  createStatement: apiActionCreator("CREATE_STATEMENT", (statement) => ({
    statement,
  })),

  updatePersorg: apiActionCreator("UPDATE_PERSORG", (persorg) => ({ persorg })),

  fetchPropositionTextSuggestions: apiActionCreator(
    "FETCH_PROPOSITION_TEXT_SUGGESTIONS",
    (propositionText, suggestionsKey) => ({
      propositionText,
      suggestionsKey,
    })
  ),
  cancelPropositionTextSuggestions: apiActionCreator(
    "CANCEL_PROPOSITION_TEXT_SUGGESTIONS",
    (suggestionsKey) => ({
      cancelTarget: makeApiActionTypes("FETCH_PROPOSITION_TEXT_SUGGESTIONS")[0],
      suggestionsKey,
    })
  ),

  fetchWritTitleSuggestions: apiActionCreator(
    "FETCH_WRIT_TITLE_SUGGESTIONS",
    (writTitle, suggestionsKey) => ({
      writTitle,
      suggestionsKey,
    })
  ),
  cancelWritTitleSuggestions: apiActionCreator(
    "CANCEL_WRIT_TITLE_SUGGESTIONS",
    (suggestionsKey) => ({
      cancelTarget: makeApiActionTypes("FETCH_WRIT_TITLE_SUGGESTIONS")[0],
      suggestionsKey,
    })
  ),

  fetchTagNameSuggestions: apiActionCreator(
    "FETCH_TAG_NAME_SUGGESTIONS",
    (tagName, suggestionsKey) => ({
      tagName,
      suggestionsKey,
    })
  ),
  cancelTagNameSuggestions: apiActionCreator(
    "CANCEL_TAG_NAME_SUGGESTIONS",
    (suggestionsKey) => ({
      cancelTarget: makeApiActionTypes("FETCH_TAG_NAME_SUGGESTIONS")[0],
      suggestionsKey,
    })
  ),

  fetchMainSearchSuggestions: apiActionCreator(
    "FETCH_MAIN_SEARCH_SUGGESTIONS",
    (searchText, suggestionsKey) => ({
      searchText,
      suggestionsKey,
    })
  ),
  cancelMainSearchSuggestions: apiActionCreator(
    "CANCEL_MAIN_SEARCH_SUGGESTIONS",
    (suggestionsKey) => ({
      cancelTarget: makeApiActionTypes("FETCH_MAIN_SEARCH_SUGGESTIONS")[0],
      suggestionsKey,
    })
  ),

  fetchPersorgNameSuggestions: apiActionCreator(
    "FETCH_PERSORG_NAME_SUGGESTIONS",
    (searchText, suggestionsKey) => ({
      searchText,
      suggestionsKey,
    })
  ),
  cancelPersorgNameSuggestions: apiActionCreator(
    "CANCEL_PERSORG_NAME_SUGGESTIONS",
    (suggestionsKey) => ({
      cancelTarget: makeApiActionTypes("FETCH_PERSORG_NAME_SUGGESTIONS")[0],
      suggestionsKey,
    })
  ),

  createJustification: apiActionCreator(
    "CREATE_JUSTIFICATION",
    (justification) => ({ justification })
  ),
  deleteJustification: apiActionCreator(
    "DELETE_JUSTIFICATION",
    (justification) => ({ justification })
  ),

  fetchMainSearchResults: apiActionCreator(
    "FETCH_MAIN_SEARCH_RESULTS",
    (searchText) => ({ searchText })
  ),
  fetchPropositionsSearch: apiActionCreator(
    "FETCH_PROPOSITIONS_SEARCH",
    (searchText) => ({ searchText })
  ),

  fetchTag: apiActionCreator("FETCH_TAG", (tagId) => ({ tagId })),
  fetchTaggedPropositions: apiActionCreator(
    "FETCH_TAGGED_PROPOSITIONS",
    (tagId) => ({ tagId })
  ),
};
type UnknownApiActionCreator = ApiActionCreator<
  unknown,
  unknown,
  void | PrepareAction<unknown>
>;
export const apiActionCreatorsByActionType = reduce(
  api,
  (result: { [key: string]: UnknownApiActionCreator }, actionCreator) => {
    result[str(actionCreator)] = actionCreator as any;
    return result;
  },
  {}
);

/** "API-like": actions that indirectly result in API calls, such as actions that are translated into one or another
 * API call depending on some payload value or those that correspond to multiple API calls
 */
export const apiLike = {
  deleteJustificationRootTarget: createAction(
    "DELETE_JUSTIFICATION_ROOT_TARGET",
    (
      rootTargetType: JustificationRootTargetType,
      rootTarget: Persisted<JustificationRootTarget>
    ) => ({ rootTargetType, rootTarget })
  ),
  fetchJustificationTargets: createAction(
    "FETCH_JUSTIFICATION_TARGETS",
    (targetInfos: ContextTrailItemInfo[]) => ({ targetInfos })
  ),
};

/** UI actions */
export const ui = {
  unhandledAppClick: createAction("UI/UNHANDLED_APP_CLICK"),
  unhandledAppTouch: createAction("UI/UNHANDLED_APP_TOUCH"),
  showNavDrawer: createAction("SHOW_NAV_DRAWER"),
  hideNavDrawer: createAction("HIDE_NAV_DRAWER"),
  toggleNavDrawerVisibility: createAction("TOGGLE_NAV_DRAWER_VISIBILITY"),
  setNavDrawerVisibility: createAction("SET_NAV_DRAWER_VISIBILITY"),
  addToast: createAction("ADD_TOAST", (text: string) => ({ text })),
  dismissToast: createAction("DISMISS_TOAST"),

  mainSearchTextChange: createAction("MAIN_SEARCH_TEXT_CHANGE"),
  loginCredentialChange: createAction("LOGIN_CREDENTIAL_CHANGE"),
  clearJustificationsSearch: createAction("UI/CLEAR_JUSTIFICATIONS_SEARCH"),

  // TODO(92): remove transient actions, reducers, and sagas
  beginInteractionWithTransient: createAction(
    "UI/BEGIN_INTERACTION_WITH_TRANSIENT",
    (transientId: unknown) => ({ transientId })
  ),
  endInteractionWithTransient: createAction(
    "UI/END_INTERACTION_WITH_TRANSIENT",
    (transientId: unknown) => ({ transientId })
  ),
  showTransient: createAction("UI/SHOW_TRANSIENT", (transientId: unknown) => ({
    transientId,
  })),
  scheduleDelayedHideTransient: createAction(
    "UI/SCHEDULE_DELAYED_HIDE_TRANSIENT",
    (transientId: unknown, hideDelay: unknown) => ({ transientId, hideDelay })
  ),
  tryCancelDelayedHideTransient: createAction(
    "UI/TRY_CANCEL_DELAYED_HIDE_TRANSIENT",
    (transientId, cause) => ({ transientId, cause }),
  ),
  cancelDelayedHideTransient: createAction(
    "UI/CANCEL_DELAYED_HIDE_TRANSIENT",
    (transientId: unknown) => ({ transientId })
  ),
  hideAllTransients: createAction("UI/HIDE_ALL_TRANSIENTS"),
  hideOtherTransients: createAction(
    "UI/HIDE_OTHER_TRANSIENTS",
    (visibleTransientId: unknown) => ({ visibleTransientId })
  ),
  hideTransient: createAction(
    "UI/HIDE_TRANSIENT",
    (transientId, cause) => ({ transientId, cause }),
  ),
  windowResize: createAction("UI/WINDOW_RESIZE"),
  setCanHover: createAction("UI/SET_CAN_HOVER", (canHover: boolean) => ({
    canHover,
  })),

  expand: createAction("UI/EXPAND", (widgetId: WidgetId) => ({ widgetId })),
  collapse: createAction("UI/COLLAPSE", (widgetId: WidgetId) => ({
    widgetId,
  })),

  enableMobileSite: createAction("UI/ENABLE_MOBILE_SITE"),
  disableMobileSite: createAction("UI/DISABLE_MOBILE_SITE"),

  clearTaggedPropositions: createAction("UI/CLEAR_TAGGED_PROPOSITIONS"),
};

export const pages = {
  // TODO(93): replace bespoke password reset page actions with an editor, if possible.
  beginPasswordResetRequest: createAction("PAGES/BEGIN_PASSWORD_RESET"),
  passwordResetRequestPropertyChange: createAction(
    "PAGES/PASSWORD_RESET_REQUEST_PROPERTY_CHANGE",
    (properties: PropertyChanges) => ({ properties })
  ),
  beginPasswordResetConfirmation: createAction(
    "PAGES/BEGIN_PASSWORD_RESET_CONFIRMATION"
  ),
  passwordResetConfirmationPropertyChange: createAction(
    "PAGES/PASSWORD_RESET_CONFIRMATION_PROPERTY_CHANGE",
    (properties: PropertyChanges) => ({ properties })
  ),
};

export const privacyConsent = {
  update: createAction(
    "PRIVACY_CONSENT/UPDATE",
    (cookies: PrivacyConsentCookie[]) => ({ cookies })
  ),
};

export type EditorActionCreator = ActionFunctionAny<Action<string>>;
export type EditorCommitActionCreator = EditorActionCreator & {
  result: ActionFunctionAny<Action<string>>;
};
const commitEdit = createAction(
  "EDITORS/COMMIT_EDIT",
  (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
) as ActionFunctionAny<Action<string>> as EditorCommitActionCreator;
commitEdit.result = createAction(
  "EDITORS/COMMIT_EDIT" + actionTypeDelim + "RESULT",
  (editorType: EditorType, editorId: EditorId, result) => ({
    editorType,
    editorId,
    result,
  })
);

export type ListPathFactory = string | ((payload: any) => string);

/** Editor actions */
export const editors = {
  beginEdit: createAction(
    "EDITORS/BEGIN_EDIT",
    (editorType: EditorType, editorId: EditorId, entity: EditorEntity) => ({
      editorType,
      editorId,
      entity,
    })
  ),
  propertyChange: createAction(
    "EDITORS/PROPERTY_CHANGE",
    (
      editorType: EditorType,
      editorId: EditorId,
      properties: { [key: string]: any }
    ) => ({ editorType, editorId, properties })
  ),
  commitEdit,
  cancelEdit: createAction(
    "EDITORS/CANCEL_EDIT",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),

  addListItem: createAction(
    "EDITORS/ON_ADD_LIST_ITEM",
    (
      editorType: EditorType,
      editorId: EditorId,
      itemIndex: number,
      listPathMaker: () => ListPathFactory,
      itemFactory: () => any
    ) => ({ editorType, editorId, itemIndex, listPathMaker, itemFactory }),
  ),
  removeListItem: createAction(
    "EDITORS/ON_REMOVE_LIST_ITEM",
    (
      editorType: EditorType,
      editorId: EditorId,
      itemIndex: number,
      listPathMaker: ListPathFactory
    ) => ({ editorType, editorId, itemIndex, listPathMaker })
  ),

  addSpeaker: createAction(
    "EDITORS/ADD_SPEAKER",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
  removeSpeaker: createAction(
    "EDITORS/REMOVE_SPEAKER",
    (
      editorType: EditorType,
      editorId: EditorId,
      speaker: Persorg,
      index: number
    ) => ({
      editorType,
      editorId,
      speaker,
      index,
    })
  ),
  replaceSpeaker: createAction(
    "EDITORS/REPLACE_SPEAKER",
    (
      editorType: EditorType,
      editorId: EditorId,
      speaker: Persorg,
      index: number
    ) => ({
      editorType,
      editorId,
      speaker,
      index,
    })
  ),

  addUrl: createAction(
    "EDITORS/ADD_URL",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
  removeUrl: createAction(
    "EDITORS/REMOVE_URL",
    (editorType: EditorType, editorId: EditorId, url: Url, index: number) => ({
      editorType,
      editorId,
      url,
      index,
    })
  ),

  addPropositionCompoundAtom: createAction(
    "EDITORS/ADD_PROPOSITION_COMPOUND_ATOM",
    (editorType: EditorType, editorId: EditorId, index: number) => ({
      editorType,
      editorId,
      index,
    })
  ),
  removePropositionCompoundAtom: createAction(
    "EDITORS/REMOVE_PROPOSITION_COMPOUND_ATOM",
    (
      editorType: EditorType,
      editorId: EditorId,
      atom: PropositionCompoundAtom,
      index: number
    ) => ({
      editorType,
      editorId,
      atom,
      index,
    })
  ),

  tagProposition: createAction(
    "EDITORS/TAG_PROPOSITION",
    (editorType: EditorType, editorId: EditorId, tag: Tag) => ({
      editorType,
      editorId,
      tag,
    })
  ),
  unTagProposition: createAction(
    "EDITORS/UN_TAG_PROPOSITION",
    (editorType: EditorType, editorId: EditorId, tag: Tag) => ({
      editorType,
      editorId,
      tag,
    })
  ),
  antiTagProposition: createAction(
    "EDITORS/ANTI_TAG_PROPOSITION",
    (editorType: EditorType, editorId: EditorId, tag: Tag) => ({
      editorType,
      editorId,
      tag,
    })
  ),

  resetSubmission: createAction(
    "EDITORS/RESET_SUBMISSION",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
};

/** Actions that change the current page */
export const goto = {
  login: createAction(
    "GOTO/LOGIN",
    (loginRedirectLocation: Location<unknown>) => ({ loginRedirectLocation })
  ),
  proposition: createAction("GOTO/PROPOSITION", (proposition: Proposition) => ({
    proposition,
  })),
  statement: createAction("GOTO/STATEMENT", (statement: Statement) => ({
    statement,
  })),
  justification: createAction(
    "GOTO/JUSTIFICATION",
    (justification: Justification) => ({ justification })
  ),
  mainSearch: createAction("GOTO/MAIN_SEARCH", (mainSearchText: string) => ({
    mainSearchText,
  })),
  tag: createAction("GOTO/TAG", (tag: Tag) => ({ tag })),
  createJustification: createAction("GOTO/CREATE_JUSTIFICATION"),
  writQuote: createAction("GOTO/WRIT_QUOTE", (writQuote: WritQuote) => ({
    writQuote,
  })),
};

/** Actions that represent multi-step flows */
export const flows = {
  fetchAndBeginEditOfNewJustificationFromBasisSource: createAction(
    "FLOWS/FETCH_AND_BEGIN_EDIT_OF_NEW_JUSTIFICATION_FROM_BASIS_SOURCE",
    (
      editorType: EditorType,
      editorId: EditorId,
      basisSourceType: JustificationBasisSourceType,
      basisSourceId: EntityId
    ) => ({ editorType, editorId, basisSourceType, basisSourceId })
  ),
  beginEditOfNewJustificationFromTarget: createAction(
    "FLOWS/BEGIN_EDIT_OF_NEW_JUSTIFICATION_FROM_TARGET",
    (content: ExtensionAnnotationContent, source: Source, target: Target) => ({
      content,
      source,
      target,
    })
  ),
  commitEditThenView: createAction(
    "FLOWS/COMMIT_PROPOSITION_THEN_VIEW",
    (editorType: EditorType, editorId: EditorId) => ({ editorType, editorId })
  ),
  commitEditThenPutActionOnSuccess: createAction(
    "FLOWS/COMMIT_EDIT_THEN_PUT_ACTION_ON_SUCCESS",
    (editorType: EditorType, editorId: EditorId, onSuccessAction: Action) => ({
      editorType,
      editorId,
      onSuccessAction,
    })
  ),
};

export const autocompletes = {
  clearSuggestions: createAction(
    "AUTOCOMPLETES/CLEAR_SUGGESTIONS",
    (suggestionsKey: SuggestionsKey) => ({ suggestionsKey })
  ),
};

export const errors = {
  clearLoggedErrors: createAction("ERRORS/CLEAR_LOGGED_ERRORS"),
};
