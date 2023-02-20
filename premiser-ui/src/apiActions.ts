import reduce from "lodash/reduce";
import {
  PayloadActionCreator,
  PrepareAction,
  ActionCreatorWithPreparedPayload,
  PayloadAction,
} from "@reduxjs/toolkit";
import { schema } from "normalizr";
import { isEmpty, isFunction, isObject, join, toString } from "lodash";
import queryString from "query-string";

import {
  EntityId,
  JustificationVotePolarities,
  PropositionTagVotePolarities,
  JustificationRootTargetType,
  Tag,
  JustificationRootTargetTypes,
  httpMethods,
  HttpMethod,
  JustificationRootTargetInfo,
  SortDirections,
  encodeQueryStringObject,
  JustificationSearchFilters,
  EntityName,
  PropositionRef,
  SentenceType,
  TaggableEntityType,
  TagVotePolarities,
  makeCreateTagVote,
  CreateJustification,
  CreateCounterJustification,
  CreateProposition,
  TagVoteViewModel,
  TagVoteRef,
  PropositionTagVoteOut,
  UpdateWritQuote,
  CreateWritQuote,
  ContinuationToken,
  CreateAccountSettings,
  UpdateAccountSettings,
  UpdateProposition,
  CreateStatement,
  UpdatePersorg,
} from "howdju-common";
import {
  InferPathParams,
  InferQueryStringParams,
  InferRequestBody,
  ServiceRoute,
  serviceRoutes,
} from "howdju-service-routes";

import {
  accountSettingsSchema,
  justificationSchema,
  justificationsSchema,
  justificationVoteSchema,
  mainSearchResultsSchema,
  persorgSchema,
  persorgsSchema,
  propositionCompoundSchema,
  propositionSchema,
  propositionsSchema,
  propositionTagVoteSchema,
  sourceExcerptParaphraseSchema,
  statementSchema,
  statementsSchema,
  tagSchema,
  tagsSchema,
  tagVoteSchema,
  userSchema,
  writQuoteSchema,
  writQuotesSchema,
  writsSchema,
} from "./normalizationSchemas";
import { actionTypeDelim, createAction } from "./actionHelpers";
import { str } from "./actionHelpers";
import { UiErrorType } from "./uiErrors";
import { SuggestionsKey, WidgetId } from "./types";
import { compile } from "path-to-regexp";
import { JsonObject, Schema } from "type-fest";

/**
 * An action creator representing API calls.
 *
 * A PayloadActionCreator with a response field for creating the response action.
 *
 * ApiActionCreator types must be strings because we generate them.
 *
 * @typeparam P payload type
 * @typeparam RP response payload type
 * @typeparam PA prepare action type
 */
export type ApiActionCreator<
  Payload,
  ResponsePayload,
  PA extends void | PrepareAction<Payload>
> = PayloadActionCreator<Payload, string, PA> & {
  response: ActionCreatorWithPreparedPayload<
    unknown[],
    ResponsePayload,
    string,
    Error,
    ApiResponseActionMeta<any, any>
  >;
};

export type ApiActionCreator2<
  Args extends unknown[],
  Payload,
  Meta,
  ResponsePayload
> = ActionCreatorWithPreparedPayload<Args, Payload, string, never, Meta> & {
  response: ActionCreatorWithPreparedPayload<
    unknown[],
    ResponsePayload,
    string,
    Error,
    ApiResponseActionMeta<any, any>
  >;
};

const makeApiActionTypes = (type: string) => {
  const requestType = "API" + actionTypeDelim + type;
  const responseType = requestType + actionTypeDelim + "RESPONSE";
  return [requestType, responseType];
};

export type ApiResponseActionMeta<N, P> = {
  normalizationSchema: N;
  requestPayload: P;
};

/**
 * @typeparam N the type of the normalization schema
 */
interface ResourceApiConfig<B, N> {
  endpoint: string;
  fetchInit?: {
    method: HttpMethod;
    body?: B;
  };
  canSkipRehydrate?: boolean;
  cancelKey?: string;
  normalizationSchema?: N;
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
type ExtractSchemaEntity<S> = S extends schema.Entity<infer E>
  ? E
  : {
      [Key in keyof S]: ExtractSchemaEntity<S[Key]>;
    };

/** Properties that may be present on API responses */
export interface ApiResponseWrapper {
  /**
   * Whether an entity equivalent to the top-level entity of a POST's body already existed on the
   * server.
   *
   * Although this should only be present for responses to Create/POSTs, it seemed overly complicated
   * to try and type it into the response action creator. So we make it optional on all responses.
   */
  isExtant?: boolean;
  /** A pagination token. */
  continuationToken?: string;
}

type Prepared<P> = { payload: P; meta?: any };

/**
 * The meta of an ApiAction
 *
 * @typeparam P the payload type.
 */
export type ApiActionMeta<P> = {
  apiConfig:
    | ResourceApiConfig<any, any>
    | ((p: P) => ResourceApiConfig<any, any>);
};
export type ApiAction<P> = PayloadAction<P, string, ApiActionMeta<P>>;
export type ApiAction2<Route extends ServiceRoute> = PayloadAction<
  ApiConfig<Route>
>;
export type AnyApiAction = ApiAction<any> | ApiAction2<any>;
export type ApiResponseAction<P> = PayloadAction<
  P,
  string,
  ApiResponseActionMeta<any, P>,
  Error
>;

type InferPrepareAction<PP extends (...args: any[]) => any> = PP extends (
  ...args: any[]
) => Prepared<any>
  ? PP & { meta: ApiActionMeta<InferPayload<PP>> }
  : (...args: Parameters<PP>) => {
      payload: ReturnType<PP>;
      meta: ApiActionMeta<InferPayload<PP>>;
    };
type InferPayload<PP extends (...args: any[]) => any> = PP extends (
  ...args: any[]
) => Prepared<infer P>
  ? P
  : ReturnType<PP>;

/**
 * Create an action creator having a property `.response` with another action creator for corresponding API responses
 *
 * @param type the type of the action
 * @param payloadCreatorOrPrepare a function that creates the payload directly or returns a
 *   @reduxjs/toolkit prepared object.
 * @param apiConfigCreator the resource config for the API endpoint, or a function for creating it from
 *   the payload. The apiConfig's normalizationSchema determines the payload of the response actions.
 * @typeparam P the payload type
 * @typeparam N the type of the normalization schema. Used to infer the payload of the response action.
 * @typeparam PA the prepare function type
 */
function apiActionCreator<
  PP extends ((...args: any[]) => P) | ((...args: any[]) => Prepared<P>),
  N,
  P = InferPayload<PP>
>(
  type: string,
  payloadCreatorOrPrepare: PP | undefined,
  apiConfigCreator?:
    | ResourceApiConfig<any, N>
    | ((p: P) => ResourceApiConfig<any, N>)
): ApiActionCreator<
  P,
  ExtractSchemaEntity<N> & ApiResponseWrapper,
  InferPrepareAction<PP>
> {
  const [requestType, responseType] = makeApiActionTypes(type);

  // Add apiConfig to meta
  function requestPrepare(...args: any[]) {
    let prepared = payloadCreatorOrPrepare
      ? payloadCreatorOrPrepare(...args)
      : ({} as Prepared<P>);
    if (apiConfigCreator) {
      if (!isObject(prepared) || !("payload" in prepared)) {
        // Allow payloadCreatorOrPrepare to return an object that already has payload in it,
        // otherwise make the entire return value the payload.
        prepared = { payload: prepared, meta: {} };
      } else if (!prepared.meta) {
        prepared.meta = {};
      }

      prepared.meta.apiConfig = isFunction(apiConfigCreator)
        ? apiConfigCreator(prepared.payload)
        : apiConfigCreator;
    }
    return prepared;
  }

  type Response = ExtractSchemaEntity<N> & ApiResponseWrapper;

  const ac = createAction(requestType, requestPrepare) as ApiActionCreator<
    P,
    Response,
    InferPrepareAction<PP>
  >;

  ac.response = createAction(
    responseType,
    (payload: ExtractSchemaEntity<N>, meta: ApiResponseActionMeta<N, P>) => ({
      payload,
      meta,
    })
  ) as ActionCreatorWithPreparedPayload<
    unknown[],
    Response,
    string,
    Error,
    ApiResponseActionMeta<N, P>
  >;
  return ac;
}

/** Return never if the Key doesn't correspond to an entity requiring normalization. */
type ToEntityFieldKey<
  Body extends Record<string, any>,
  Key extends keyof Body
> = Body[Key] extends (infer I)[]
  ? EntityName<I> extends never
    ? never
    : Key
  : EntityName<Body[Key]> extends never
  ? never
  : Key;

/** Remove all properties from Body except those that are entities. */
type EntityFieldsOnly<Body extends Record<string, any>> = {
  [K in keyof Body as ToEntityFieldKey<Body, K>]: Body[K];
};

type InferResponseReturnType<Route extends ServiceRoute> = Awaited<
  ReturnType<Route["request"]["handler"]>
>;
type InferResponseBodyEntities<Route extends ServiceRoute> =
  InferResponseReturnType<Route> extends Record<string, any>
    ? EntityFieldsOnly<InferResponseReturnType<Route>["body"]>
    : never;

type InferResponseBody<Route extends ServiceRoute> =
  InferResponseReturnType<Route> extends Record<string, any>
    ? InferResponseReturnType<Route>["body"]
    : never;

type BaseApiActionConfig<Route extends ServiceRoute> = {
  /** The values to fill into the service route's path's parameters */
  pathParams: InferPathParams<Route>;
  /** The values to provide to the API as query string parameters. */
  queryStringParams: InferQueryStringParams<Route>;
  /** The HTTP body to send with the request. */
  body: InferRequestBody<Route>;
  /** The schema for normalizing the response entities. */
  normalizationSchema: Schema<
    InferResponseBodyEntities<Route>,
    schema.Entity<any> | schema.Array<any>
  >;
  canSkipRehydrate?: boolean;
  cancelKey?: string;
};
/** Removes properties inferred to be `never`. */
type ApiActionConfig<Route extends ServiceRoute> = {
  [key in keyof BaseApiActionConfig<Route> as BaseApiActionConfig<Route>[key] extends never
    ? never
    : key]: BaseApiActionConfig<Route>[key];
};

type ApiConfig<Route extends ServiceRoute> = {
  endpoint: string;
  /** The schema for normalizing the response entities. */
  normalizationSchema: Schema<
    InferResponseBodyEntities<Route>,
    schema.Entity<any>
  >;
  fetchInit: {
    method: HttpMethod;
    body: JsonObject;
  };
  canSkipRehydrate: boolean;
  cancelKey: string;
};

const pathMakersByPathPattern = {} as Record<
  string,
  ReturnType<typeof compile>
>;

function makeEndpoint(
  pathPattern: string,
  pathParams: Record<string, string> | undefined,
  queryStringParams: Record<string, string | undefined> | undefined
) {
  if (!(pathPattern in pathMakersByPathPattern)) {
    pathMakersByPathPattern[pathPattern] = compile(pathPattern, {
      encode: encodeURIComponent,
    });
  }
  const pathMaker = pathMakersByPathPattern[pathPattern];
  const path = pathMaker(pathParams);
  const query = queryStringParams
    ? "?" + queryString.stringify(queryStringParams)
    : "";
  return path + query;
}

/**
 * Creates PayloadActionCreators for actions that call our API.
 *
 * Features:
 * - apiActionConfig is type-safe with the service route's request body
 * - Route parameters are type-safe with the service route.
 * - Query string parameters are type-safe with the service route.
 * - Reuses the ServiceRoute definition to determine:
 *   - Path (including type-safe path parameters)
 *   - HTTP Method
 * - Normalization schema is type-safe wtih the API's response body.
 *
 * Issues: type system doesn't warn on extra properties. (This didn't work:)
 *
 * `Config extends Exact<ApiActionConfig<Route>, Config>`
 *
 * DO_NOT_MERGE: try removing the MakeConfig extends so that it directly creates the ApiActionConfig.
 *
 * @param type The action type
 * @param route The service route this API action targets
 * @param makeConfig Additional config for calling the service route.
 */
function apiActionCreator2<
  Args extends any[],
  Route extends ServiceRoute,
  Meta = never
>(
  type: string,
  route: Route,
  makeConfig:
    | ((...args: Args) => ApiActionConfig<Route>)
    | ((...args: Args) => { config: ApiActionConfig<Route>; meta: Meta })
): ApiActionCreator2<Args, ApiConfig<Route>, Meta, InferResponseBody<Route>> {
  const [requestType, responseType] = makeApiActionTypes(type);

  type NormalizationSchema = ApiActionConfig<Route> extends {
    normalizationSchema: any;
  }
    ? ApiActionConfig<Route>["normalizationSchema"]
    : never;

  // Add apiConfig to meta
  function apiActionCreatorPrepare(...args: Args) {
    const result = makeConfig(...args);
    const apiActionConfig = "config" in result ? result.config : result;
    const { canSkipRehydrate, cancelKey } = apiActionConfig;
    const pathParams =
      "pathParams" in apiActionConfig
        ? (apiActionConfig.pathParams as Record<string, string>)
        : undefined;
    const queryStringParams =
      "queryStringParams" in apiActionConfig
        ? (apiActionConfig.queryStringParams as Record<string, string>)
        : undefined;
    const body = "body" in apiActionConfig ? apiActionConfig.body : undefined;
    const normalizationSchema =
      "normalizationSchema" in apiActionConfig
        ? apiActionConfig.normalizationSchema
        : undefined;
    const endpoint = makeEndpoint(route.path, pathParams, queryStringParams);
    const apiConfig = {
      endpoint,
      fetchInit: {
        method: route.method,
        body,
      },
      normalizationSchema,
      canSkipRehydrate,
      cancelKey,
    } as ResourceApiConfig<InferRequestBody<Route>, NormalizationSchema>;
    if ("meta" in result) {
      return { payload: apiConfig, meta: result.meta };
    }
    return { payload: apiConfig };
  }

  type Response = InferResponseBody<Route> & ApiResponseWrapper;

  const actionCreator = createAction(
    requestType,
    apiActionCreatorPrepare
  ) as unknown as ApiActionCreator2<Args, ApiConfig<Route>, Meta, any>;

  actionCreator.response = createAction(
    responseType,
    (
      payload: InferResponseBody<Route>,
      meta: ApiResponseActionMeta<NormalizationSchema, ApiActionConfig<Route>>
    ) => ({
      payload,
      meta,
    })
  ) as ActionCreatorWithPreparedPayload<
    unknown[],
    Response,
    string,
    Error,
    ApiResponseActionMeta<NormalizationSchema, ApiActionConfig<Route>>
  >;
  return actionCreator;
}

type ContinuationQueryStringParams = {
  continuationToken?: string;
  count: string;
  sorts?: string;
};

interface JustificationSearchQueryStringParams {
  filters?: string;
  includeUrls?: string;
  sorts?: string;
  count?: string;
  continuationToken?: string;
}

const rootTargetEndpointsByType = {
  [JustificationRootTargetTypes.PROPOSITION]: {
    endpoint: "propositions",
    normalizationSchema: { proposition: propositionSchema },
  },
  [JustificationRootTargetTypes.STATEMENT]: {
    endpoint: "statements",
    normalizationSchema: { statement: statementSchema },
  },
};

const defaultSorts = `created=${SortDirections.DESCENDING}`;

export const callApiResponse = createAction(
  "CALL_API_RESPONSE",
  (result) => result
) as ActionCreatorWithPreparedPayload<
  unknown[], // Args
  { errorType: UiErrorType },
  string, // Type
  Error,
  unknown // Meta
>;

/** Actions that directly result in API calls */
export const api = {
  fetchProposition: apiActionCreator2(
    "FETCH_PROPOSITION",
    serviceRoutes.readProposition,
    (propositionId: EntityId) => ({
      pathParams: { propositionId },
      normalizationSchema: { proposition: propositionSchema },
    })
  ),
  fetchPropositions: apiActionCreator2(
    "FETCH_PROPOSITIONS",
    serviceRoutes.readPropositions,
    (propositionIds: EntityId[]) => {
      const queryStringParams = propositionIds
        ? {
            propositionIds: join(propositionIds, ","),
          }
        : {};
      return {
        queryStringParams,
        normalizationSchema: { propositions: propositionsSchema },
      };
    }
  ),
  fetchPropositionCompound: apiActionCreator2(
    "FETCH_PROPOSITION_COMPOUND",
    serviceRoutes.readPropositionCompound,
    (propositionCompoundId: EntityId) => ({
      pathParams: { propositionCompoundId },
      normalizationSchema: { propositionCompound: propositionCompoundSchema },
    })
  ),
  fetchRootJustificationTarget: apiActionCreator(
    "FETCH_ROOT_JUSTIFICATION_TARGET",
    (
      rootTargetType: JustificationRootTargetType,
      rootTargetId: EntityId
    ): JustificationRootTargetInfo => ({
      rootTargetType,
      rootTargetId,
    }),
    ({ rootTargetType, rootTargetId }) => {
      const { endpoint, normalizationSchema } =
        rootTargetEndpointsByType[rootTargetType];
      return {
        endpoint: `${endpoint}/${rootTargetId}?include=justifications`,
        fetchInit: {
          method: httpMethods.GET,
        },
        normalizationSchema,
      };
    }
  ),

  fetchWritQuote: apiActionCreator2(
    "FETCH_WRIT_QUOTE",
    serviceRoutes.readWritQuote,
    (writQuoteId: EntityId) => ({
      pathParams: { writQuoteId },
      normalizationSchema: { writQuote: writQuoteSchema },
    })
  ),
  createWritQuote: apiActionCreator2(
    "CREATE_WRIT_QUOTE",
    serviceRoutes.createWritQuote,
    (writQuote: CreateWritQuote) => ({
      body: { writQuote },
      normalizationSchema: { writQuote: writQuoteSchema },
    })
  ),
  updateWritQuote: apiActionCreator2(
    "UPDATE_WRIT_QUOTE",
    serviceRoutes.updateWritQuote,
    (writQuote: UpdateWritQuote) => ({
      body: { writQuote },
      pathParams: { writQuoteId: writQuote.id },
      normalizationSchema: { writQuote: writQuoteSchema },
    })
  ),

  /** @deprecated */
  fetchSourceExcerptParaphrase: apiActionCreator2(
    "FETCH_SOURCE_EXCERPT_PARAPHRASE",
    serviceRoutes.readSourceExcerptParaphrase,
    (sourceExcerptParaphraseId: EntityId) => ({
      pathParams: { sourceExcerptParaphraseId },
      normalizationSchema: {
        sourceExcerptParaphrase: sourceExcerptParaphraseSchema,
      },
    })
  ),
  fetchPersorg: apiActionCreator2(
    "FETCH_PERSORG",
    serviceRoutes.readPersorg,
    (persorgId: EntityId) => ({
      pathParams: {
        persorgId,
      },
      normalizationSchema: { persorg: persorgSchema },
    })
  ),
  fetchSpeakerStatements: apiActionCreator2(
    "FETCH_PERSORG_STATEMENTS",
    serviceRoutes.readSpeakerStatements,
    (speakerPersorgId: EntityId) => ({
      queryStringParams: { speakerPersorgId },
      normalizationSchema: { statements: statementsSchema },
    })
  ),
  fetchSentenceStatements: apiActionCreator2(
    "FETCH_SENTENCE_STATEMENTS",
    serviceRoutes.readSentenceStatements,
    (sentenceType: SentenceType, sentenceId: EntityId) => ({
      queryStringParams: {
        sentenceType,
        sentenceId,
      },
      normalizationSchema: { statements: statementsSchema },
    })
  ),
  fetchRootPropositionStatements: apiActionCreator2(
    "FETCH_ROOT_PROPOSITION_STATEMENTS",
    serviceRoutes.readRootPropositionStatements,
    (rootPropositionId: EntityId) => ({
      queryStringParams: { rootPropositionId },
      normalizationSchema: { statements: statementsSchema },
    })
  ),
  fetchIndirectPropositionStatements: apiActionCreator2(
    "FETCH_INDIRECT_PROPOSITION_STATEMENTS",
    serviceRoutes.readIndirectRootPropositionStatements,
    (rootPropositionId) => ({
      queryStringParams: { rootPropositionId, indirect: null },
      normalizationSchema: { statements: statementsSchema },
    })
  ),

  fetchRecentPropositions: apiActionCreator2(
    "FETCH_RECENT_PROPOSITIONS",
    serviceRoutes.readPropositions,
    (
      widgetId: WidgetId,
      count: number,
      continuationToken?: ContinuationToken
    ) => {
      const queryStringParams: ContinuationQueryStringParams = {
        continuationToken,
        count: toString(count),
      };
      if (!queryStringParams.continuationToken) {
        queryStringParams.sorts = defaultSorts;
      }
      return {
        queryStringParams,
        normalizationSchema: { propositions: propositionsSchema },
        // DO_NOT_MERGE until we fix the listeEntities reducers to get widgetId from meta.
        meta: { widgetId },
      };
    }
  ),
  fetchRecentWrits: apiActionCreator2(
    "FETCH_RECENT_WRITS",
    serviceRoutes.readWrits,
    (
      widgetId: WidgetId,
      count: number,
      continuationToken?: ContinuationToken
    ) => {
      const queryStringParams: ContinuationQueryStringParams = {
        continuationToken,
        count: toString(count),
      };
      if (!queryStringParams.continuationToken) {
        queryStringParams.sorts = defaultSorts;
      }
      return {
        queryStringParams,
        normalizationSchema: { writs: writsSchema },
        // DO_NOT_MERGE until we fix the listeEntities reducers to get widgetId from meta.
        meta: { widgetId },
      };
    }
  ),
  fetchRecentWritQuotes: apiActionCreator2(
    "FETCH_RECENT_WRIT_QUOTES",
    serviceRoutes.readWritQuotes,
    (
      widgetId: WidgetId,
      count: number,
      continuationToken?: ContinuationToken
    ) => {
      const queryStringParams: ContinuationQueryStringParams = {
        continuationToken,
        count: toString(count),
      };
      if (!queryStringParams.continuationToken) {
        queryStringParams.sorts = defaultSorts;
      }
      return {
        queryStringParams,
        normalizationSchema: { writQuotes: writQuotesSchema },
        // DO_NOT_MERGE until we fix the listeEntities reducers to get widgetId from meta.
        meta: { widgetId },
      };
    }
  ),
  fetchRecentJustifications: apiActionCreator2(
    "FETCH_RECENT_JUSTIFICATIONS",
    serviceRoutes.readJustifications,
    (
      widgetId: WidgetId,
      count: number,
      continuationToken?: ContinuationToken
    ) => {
      const queryStringParams: ContinuationQueryStringParams = {
        continuationToken,
        count: toString(count),
      };
      if (!queryStringParams.continuationToken) {
        queryStringParams.sorts = defaultSorts;
      }
      return {
        queryStringParams,
        normalizationSchema: { justifications: justificationsSchema },
        // DO_NOT_MERGE until we fix the listeEntities reducers to get widgetId from meta.
        meta: { widgetId },
      };
    }
  ),

  createAccountSettings: apiActionCreator2(
    "CREATE_ACCOUNT_SETTINGS",
    serviceRoutes.createAccountSettings,
    (accountSettings: CreateAccountSettings) => ({
      body: { accountSettings },
      normalizationSchema: { accountSettings: accountSettingsSchema },
    })
  ),
  fetchAccountSettings: apiActionCreator2(
    "FETCH_ACCOUNT_SETTINGS",
    serviceRoutes.readAccountSettings,
    () => ({
      normalizationSchema: {
        accountSettings: accountSettingsSchema,
      },
    })
  ),
  updateAccountSettings: apiActionCreator2(
    "UPDATE_ACCOUNT_SETTINGS",
    serviceRoutes.updateAccountSettings,
    (accountSettings: UpdateAccountSettings) => ({
      body: { accountSettings },
      normalizationSchema: { accountSettings: accountSettingsSchema },
    })
  ),

  createContentReport: apiActionCreator2(
    "CREATE_CONTENT_REPORT",
    serviceRoutes.createContentReport,
    (contentReport) => ({
      body: { contentReport },
    })
  ),

  fetchJustificationsSearch: apiActionCreator2(
    "FETCH_JUSTIFICATIONS_SEARCH",
    serviceRoutes.readJustifications,
    ({
      filters,
      includeUrls = false,
      sorts,
      count,
      continuationToken,
    }: {
      filters: JustificationSearchFilters;
      includeUrls?: boolean;
      sorts?: Record<string, string>;
      count: number;
      continuationToken?: string;
    }) => {
      const queryStringParams: JustificationSearchQueryStringParams = {};

      if (!isEmpty(filters)) {
        queryStringParams.filters = encodeQueryStringObject(filters);
      }

      if (!isEmpty(includeUrls)) {
        queryStringParams.includeUrls = includeUrls.toString();
      }

      if (!isEmpty(sorts)) {
        queryStringParams.sorts = encodeQueryStringObject(sorts);
      } else {
        queryStringParams.sorts = defaultSorts;
      }

      if (count) {
        queryStringParams.count = toString(count);
      }

      if (continuationToken) {
        queryStringParams.continuationToken = continuationToken;
      }

      return {
        config: {
          queryStringParams,
          normalizationSchema: { justifications: justificationsSchema },
        },
        meta: { filters },
      };
    }
  ),
  login: apiActionCreator2("LOGIN", serviceRoutes.login, (credentials) => ({
    body: { credentials },
    normalizationSchema: { user: userSchema },
  })),
  logout: apiActionCreator2("LOGOUT", serviceRoutes.logout, () => ({})),

  requestPasswordReset: apiActionCreator2(
    "REQUEST_PASSWORD_RESET",
    serviceRoutes.requestPasswordReset,
    (passwordResetRequest) => ({
      body: { passwordResetRequest },
      normalizationSchema: {},
    })
  ),
  checkPasswordResetRequest: apiActionCreator2(
    "CHECK_PASSWORD_RESET_REQUEST",
    serviceRoutes.readPasswordReset,
    (passwordResetCode) => ({
      queryStringParams: { passwordResetCode },
      normalizationSchema: {},
    })
  ),
  confirmPasswordReset: apiActionCreator2(
    "CONFIRM_PASSWORD_RESET",
    serviceRoutes.completePasswordReset,
    (passwordResetCode: string, passwordResetConfirmation: string) => ({
      body: {
        passwordResetCode,
        passwordResetConfirmation,
      },
      normalizationSchema: { user: userSchema },
    })
  ),

  requestRegistration: apiActionCreator2(
    "REQUEST_REGISTRATION",
    serviceRoutes.requestRegistration,
    (registrationRequest) => ({
      body: {
        registrationRequest,
      },
      normalizationSchema: {},
    })
  ),
  checkRegistration: apiActionCreator2(
    "CHECK_REGISTRATION",
    serviceRoutes.readRegistrationRequest,
    (registrationCode) => ({
      queryStringParams: { registrationCode },
      normalizationSchema: {},
    })
  ),
  confirmRegistration: apiActionCreator2(
    "CONFIRM_REGISTRATION",
    serviceRoutes.register,
    (registrationConfirmation) => ({
      body: { registrationConfirmation },
      normalizationSchema: { user: userSchema },
    })
  ),

  verifyJustification: apiActionCreator2(
    "VERIFY_JUSTIFICATION",
    serviceRoutes.createJustificationVote,
    (justification) => ({
      body: {
        justificationVote: {
          justificationId: justification.id,
          polarity: JustificationVotePolarities.POSITIVE,
        },
      },
      meta: {
        // DO_NOT_MERGE search for references of previous votes now that it's on meta and not payload
        previousJustificationVote: justification.vote,
      },
      normalizationSchema: { justificationVote: justificationVoteSchema },
    })
  ),
  unVerifyJustification: apiActionCreator2(
    "UN_VERIFY_JUSTIFICATION",
    serviceRoutes.deleteJustificationVote,
    (justification) => ({
      body: {
        justificationVote: {
          justificationId: justification.id,
          polarity: JustificationVotePolarities.POSITIVE,
        },
      },
      meta: {
        previousJustificationVote: justification.vote,
      },
    })
  ),
  disverifyJustification: apiActionCreator2(
    "DISVERIFY_JUSTIFICATION",
    serviceRoutes.createJustificationVote,
    (justification) => ({
      body: {
        justificationVote: {
          justificationId: justification.id,
          polarity: JustificationVotePolarities.NEGATIVE,
        },
      },
      meta: {
        previousJustificationVote: justification.vote,
      },
      normalizationSchema: { justificationVote: justificationVoteSchema },
    })
  ),
  unDisverifyJustification: apiActionCreator2(
    "UN_DISVERIFY_JUSTIFICATION",
    serviceRoutes.deleteJustificationVote,
    (justification) => ({
      body: {
        justificationVote: {
          justificationId: justification.id,
          polarity: JustificationVotePolarities.NEGATIVE,
        },
      },
      meta: {
        previousJustificationVote: justification.vote,
      },
    })
  ),

  createTag: apiActionCreator(
    "CREATE_TAG",
    (
      tagTargetType: TaggableEntityType,
      tagTargetId: EntityId,
      tag: Tag,
      tagVote?: TagVoteViewModel
    ) => ({
      tagVote: makeCreateTagVote({
        targetType: tagTargetType,
        target: {
          id: tagTargetId,
        },
        polarity: TagVotePolarities.POSITIVE,
        tag,
      }),
      previousTagVote: tagVote,
    }),
    (payload) => ({
      endpoint: "tag-votes",
      fetchInit: {
        method: httpMethods.POST,
        body: payload,
      },
      normalizationSchema: { tagVote: tagVoteSchema },
    })
  ),
  createAntiTag: apiActionCreator(
    "CREATE_ANTI_TAG",
    (
      tagTargetType: TaggableEntityType,
      tagTargetId: EntityId,
      tag: Tag,
      tagVote?: TagVoteViewModel
    ) => ({
      tagVote: makeCreateTagVote({
        targetType: tagTargetType,
        target: {
          id: tagTargetId,
        },
        polarity: TagVotePolarities.NEGATIVE,
        tag,
      }),
      previousTagVote: tagVote,
    }),
    (payload) => ({
      endpoint: "tag-votes",
      fetchInit: {
        method: httpMethods.POST,
        body: payload,
      },
      normalizationSchema: { tagVote: tagVoteSchema },
    })
  ),
  unTag: apiActionCreator(
    "UN_TAG",
    (tagVote: TagVoteRef) => ({
      tagVote,
    }),
    (payload) => ({
      endpoint: `tag-votes/${payload.tagVote.id}`,
      fetchInit: {
        method: httpMethods.DELETE,
      },
    })
  ),

  tagProposition: apiActionCreator2(
    "TAG_PROPOSITION",
    serviceRoutes.createPropositionTagVote,
    (
      propositionId: EntityId,
      tag: Tag,
      propositionTagVote?: PropositionTagVoteOut
    ) => ({
      body: {
        propositionTagVote: {
          polarity: PropositionTagVotePolarities.POSITIVE,
          proposition: PropositionRef.parse({ id: propositionId }),
          tag,
        },
      },
      meta: { prevPropositionTagVote: propositionTagVote },
      normalizationSchema: { propositionTagVote: propositionTagVoteSchema },
    })
  ),
  antiTagProposition: apiActionCreator2(
    "ANTI_TAG_PROPOSITION",
    serviceRoutes.createPropositionTagVote,
    (
      propositionId: EntityId,
      tag: Tag,
      propositionTagVote?: PropositionTagVoteOut
    ) => ({
      body: {
        propositionTagVote: {
          polarity: PropositionTagVotePolarities.NEGATIVE,
          proposition: PropositionRef.parse({ id: propositionId }),
          tag,
        },
      },
      meta: { prevPropositionTagVote: propositionTagVote },
      normalizationSchema: { propositionTagVote: propositionTagVoteSchema },
    })
  ),
  unTagProposition: apiActionCreator2(
    "UN_TAG_PROPOSITION",
    serviceRoutes.deletePropositionTagVote,
    (propositionTagVote: PropositionTagVoteOut) => ({
      pathParams: { propositionTagVoteId: propositionTagVote.id },
    })
  ),

  createProposition: apiActionCreator2(
    "CREATE_PROPOSITION",
    serviceRoutes.createProposition,
    (proposition: CreateProposition) => ({
      body: {
        proposition,
      },
      normalizationSchema: { proposition: propositionSchema },
    })
  ),
  updateProposition: apiActionCreator2(
    "UPDATE_PROPOSITION",
    serviceRoutes.updateProposition,
    (proposition: UpdateProposition) => ({
      body: { proposition },
      pathParams: { propositionId: proposition.id },
      normalizationSchema: { proposition: propositionSchema },
    })
  ),
  deleteProposition: apiActionCreator2(
    "DELETE_PROPOSITION",
    serviceRoutes.deleteProposition,
    (proposition: PropositionRef) => ({
      pathParams: { propositionId: proposition.id },
    })
  ),

  createStatement: apiActionCreator2(
    "CREATE_STATEMENT",
    serviceRoutes.createStatement,
    (statement: CreateStatement) => ({
      body: { statement },
      normalizationSchema: { statement: statementSchema },
    })
  ),

  updatePersorg: apiActionCreator2(
    "UPDATE_PERSORG",
    serviceRoutes.updatePersorg,
    (persorg: UpdatePersorg) => ({
      body: { persorg },
      pathParams: { persorgId: persorg.id },
      normalizationSchema: { persorg: persorgSchema },
    })
  ),

  fetchPropositionTextSuggestions: apiActionCreator2(
    "FETCH_PROPOSITION_TEXT_SUGGESTIONS",
    serviceRoutes.searchPropositions,
    (propositionText: string, suggestionsKey: SuggestionsKey) => ({
      queryStringParams: { searchText: propositionText },
      cancelKey:
        makeApiActionTypes("FETCH_PROPOSITION_TEXT_SUGGESTIONS")[0] +
        "." +
        suggestionsKey,
      // DO_NOT_MERGE: update clients to receive propositions as a property instead of a direct array
      normalizationSchema: { propositions: propositionsSchema },
    })
  ),

  fetchWritTitleSuggestions: apiActionCreator2(
    "FETCH_WRIT_TITLE_SUGGESTIONS",
    serviceRoutes.searchWrits,
    (writTitle: string, suggestionsKey: string) => ({
      queryStringParams: {
        searchText: writTitle,
      },
      cancelKey:
        makeApiActionTypes("FETCH_WRIT_TITLE_SUGGESTIONS")[0] +
        "." +
        suggestionsKey,
      // DO_NOT_MERGE: update clients to receive a property instead of a direct array
      normalizationSchema: { writs: writsSchema },
    })
  ),

  fetchTagNameSuggestions: apiActionCreator2(
    "FETCH_TAG_NAME_SUGGESTIONS",
    serviceRoutes.searchTags,
    (tagName: string, suggestionsKey: string) => ({
      queryStringParams: {
        searchText: tagName,
      },
      cancelKey:
        makeApiActionTypes("FETCH_TAG_NAME_SUGGESTIONS")[0] +
        "." +
        suggestionsKey,
      normalizationSchema: { tags: tagsSchema },
    })
  ),

  fetchMainSearchSuggestions: apiActionCreator2(
    "FETCH_MAIN_SEARCH_SUGGESTIONS",
    serviceRoutes.mainSearch,
    (searchText: string, suggestionsKey: SuggestionsKey) => ({
      queryStringParams: {
        searchText: searchText,
      },
      cancelKey:
        makeApiActionTypes("FETCH_MAIN_SEARCH_SUGGESTIONS")[0] +
        "." +
        suggestionsKey,
      normalizationSchema: mainSearchResultsSchema,
    })
  ),

  fetchPersorgNameSuggestions: apiActionCreator2(
    "FETCH_PERSORG_NAME_SUGGESTIONS",
    serviceRoutes.searchPersorgs,
    (searchText, suggestionsKey) => ({
      queryStringParams: {
        searchText: searchText,
      },
      cancelKey: `${
        makeApiActionTypes("FETCH_PERSORG_NAME_SUGGESTIONS")[0]
      }.${suggestionsKey}`,
      normalizationSchema: { persorgs: persorgsSchema },
    })
  ),

  createJustification: apiActionCreator2(
    "CREATE_JUSTIFICATION",
    serviceRoutes.createJustification,
    (justification: CreateJustification) => ({
      body: {
        justification,
      },
      normalizationSchema: { justification: justificationSchema },
    })
  ),
  // We shouldn't need a separate action for counter justifications since they are just a
  // specialization of justifications. But I couldn't get the types for the editor config to workout
  // if I reuse the createJustification action there.
  createCounterJustification: apiActionCreator2(
    "CREATE_CONTER_JUSTIFICATION",
    serviceRoutes.createJustification,
    (justification: CreateCounterJustification) => ({
      body: {
        justification,
      },
      normalizationSchema: { justification: justificationSchema },
    })
  ),
  deleteJustification: apiActionCreator2(
    "DELETE_JUSTIFICATION",
    serviceRoutes.deleteJustification,
    (justification) => ({
      pathParams: { justificationId: justification.id },
    })
  ),

  fetchMainSearchResults: apiActionCreator2(
    "FETCH_MAIN_SEARCH_RESULTS",
    serviceRoutes.mainSearch,
    (searchText) => ({
      queryStringParams: {
        searchText,
      },
      normalizationSchema: mainSearchResultsSchema,
    })
  ),

  fetchTag: apiActionCreator2("FETCH_TAG", serviceRoutes.readTag, (tagId) => ({
    pathParams: { tagId },
    normalizationSchema: { tag: tagSchema },
  })),
  fetchTaggedPropositions: apiActionCreator2(
    "FETCH_TAGGED_PROPOSITIONS",
    serviceRoutes.readTaggedPropositions,
    (tagId: EntityId) => ({
      config: {
        queryStringParams: { tagId },
        normalizationSchema: { propositions: propositionsSchema },
      },
      meta: { tagId },
    })
  ),
};

export const cancelPersorgNameSuggestions = createAction(
  "CANCEL_PERSORG_NAME_SUGGESTIONS",
  (suggestionsKey: SuggestionsKey) => ({
    cancelTarget: makeApiActionTypes("FETCH_PERSORG_NAME_SUGGESTIONS")[0],
    cancelTargetArgs: ["", suggestionsKey],
    suggestionsKey,
  })
);
export const cancelMainSearchSuggestions = createAction(
  "CANCEL_MAIN_SEARCH_SUGGESTIONS",
  (suggestionsKey: SuggestionsKey) => ({
    cancelTarget: makeApiActionTypes("FETCH_MAIN_SEARCH_SUGGESTIONS")[0],
    cancelTargetArgs: ["", suggestionsKey],
    suggestionsKey,
  })
);
export const cancelTagNameSuggestions = createAction(
  "CANCEL_TAG_NAME_SUGGESTIONS",
  (suggestionsKey: SuggestionsKey) => ({
    cancelTarget: makeApiActionTypes("FETCH_TAG_NAME_SUGGESTIONS")[0],
    cancelTargetArgs: ["", suggestionsKey],
    suggestionsKey,
  })
);
export const cancelWritTitleSuggestions = createAction(
  "CANCEL_WRIT_TITLE_SUGGESTIONS",
  (suggestionsKey: SuggestionsKey) => ({
    cancelTarget: makeApiActionTypes("FETCH_WRIT_TITLE_SUGGESTIONS")[0],
    cancelTargetArgs: ["", suggestionsKey],
    suggestionsKey,
  })
);
export const cancelPropositionTextSuggestions = createAction(
  "CANCEL_PROPOSITION_TEXT_SUGGESTIONS",
  (suggestionsKey: SuggestionsKey) => ({
    cancelTarget: makeApiActionTypes("FETCH_PROPOSITION_TEXT_SUGGESTIONS")[0],
    cancelTargetArgs: ["", suggestionsKey],
    suggestionsKey,
  })
);

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
