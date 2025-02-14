import {
  ActionCreatorWithPreparedPayload,
  PayloadAction,
} from "@reduxjs/toolkit";
import { schema } from "normalizr";
import { isEmpty, join, merge, toString, reduce } from "lodash";
import queryString from "query-string";
import { compile } from "path-to-regexp";
import { Schema } from "type-fest";
import { v4 as uuidv4 } from "uuid";

import {
  ContextTrailItemInfo,
  EntityId,
  JustificationVotePolarities,
  PropositionTagVotePolarities,
  Tag,
  SortDirections,
  encodeQueryStringObject,
  JustificationSearchFilters,
  SentenceType,
  TaggableEntityType,
  TagVotePolarities,
  CreateJustification,
  CreateCounterJustification,
  CreateProposition,
  TagVoteViewModel,
  PropositionTagVoteOut,
  UpdateWritQuote,
  CreateWritQuote,
  ContinuationToken,
  CreateAccountSettings,
  UpdateAccountSettings,
  UpdateProposition,
  CreateStatement,
  UpdatePersorg,
  serializeContextTrail,
  CreateMediaExcerpt,
  UpdateSource,
  CreateUrlLocatorsInput,
  UrlLocatorOut,
  CreateAppearance,
  JustificationView,
  AppearanceSearchFilter,
  MediaExcerptSearchFilter,
  CreatePasswordResetRequest,
  PasswordResetConfirmation,
  CreateMediaExcerptCitationsInput,
  MediaExcerptCitationOut,
  MediaExcerptSpeakerOut,
  CreateMediaExcerptSpeakersInput,
  TagPropositionVote,
  PersistedEntity,
} from "howdju-common";
import {
  InferPathParams,
  InferQueryStringParams,
  InferRequestBody,
  InferResponseBody,
  ServiceRoute,
  serviceRoutes,
} from "howdju-service-routes";

import {
  accountSettingsSchema,
  appearanceSchema,
  appearancesSchema,
  contextTrailItemsSchema,
  domainsSchema,
  justificationSchema,
  justificationsSchema,
  justificationVoteSchema,
  mainSearchResultSchema,
  mediaExcerptCitationsSchema,
  mediaExcerptSchema,
  mediaExcerptSpeakersSchema,
  mediaExcerptsSchema,
  nullSchema,
  persorgSchema,
  persorgsSchema,
  propositionCompoundSchema,
  propositionCompoundsSchema,
  propositionSchema,
  propositionsSchema,
  propositionTagVoteSchema,
  sourceExcerptParaphraseSchema,
  sourceSchema,
  sourcesSchema,
  statementSchema,
  statementsSchema,
  tagSchema,
  tagsSchema,
  tagVoteSchema,
  urlLocatorsSchema,
  urlsSchema,
  userSchema,
  usersSchema,
  writQuoteSchema,
  writQuotesSchema,
  writsSchema,
} from "@/normalization/normalizationSchemas";
import { actionTypeDelim, createAction, str } from "../actions/actionHelpers";
import { SuggestionsKey, WidgetId } from "@/types";
import {
  ApiCallConfig,
  FetchInit,
  InferResponseBodyEntities,
} from "./apiActionTypes";

// TODO(#113) type response.error as an Error when we remove redux-actions conventions
export type ApiActionCreator<
  Args extends any[],
  Route extends ServiceRoute,
  Meta,
  Payload extends ApiCallConfig<Route> = ApiCallConfig<Route>,
  ResponsePayload = InferResponseBody<Route>
> = ActionCreatorWithPreparedPayload<Args, Payload, string, never, Meta> & {
  route: Route;
  response: ActionCreatorWithPreparedPayload<
    any[],
    ResponsePayload,
    string,
    boolean,
    ApiResponseActionMeta<Payload["normalizationSchema"], Meta>
  >;
};

const makeApiActionTypes = (type: string) => {
  const requestType = "API" + actionTypeDelim + type;
  const responseType = requestType + actionTypeDelim + "RESPONSE";
  return [requestType, responseType];
};

export type ApiResponseActionMeta<N, M> = {
  normalizationSchema: N;
  requestId: string;
  requestMeta: M & {
    fetchInit: FetchInit;
  };
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

export type ApiResponseAction<P> = PayloadAction<
  P,
  string,
  ApiResponseActionMeta<any, any>,
  Error
>;

type BaseApiActionConfig<Route extends ServiceRoute> = {
  /** The values to fill into the service route's path's parameters */
  pathParams: InferPathParams<Route>;
  /** The values to provide to the API as query string parameters. */
  queryStringParams: InferQueryStringParams<Route>;
  /** The HTTP body to send with the request. */
  body: InferRequestBody<Route>;
  /**
   * The schema for normalizing the response entities.
   *
   * This object must have schemas for the entities in the response. It may optionally
   * have values for non-entities. We return some non-entities that should be normalized
   * (e.g. MediaExcerptCitations). Ideally we would require these too, but at least
   * by making the property optional we prevent property name mismatches.
   */
  normalizationSchema: Schema<
    InferResponseBodyEntities<Route>,
    // TODO(482) determine more precise bounds for the normalization schema
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
 * @param type The action type
 * @param route The service route this API action targets
 * @param makeConfig Additional config for calling the service route.
 */
function apiActionCreator<
  Args extends any[],
  Route extends ServiceRoute,
  Meta extends Record<string, any>
>(
  type: string,
  route: Route,
  makeConfig:
    | ((...args: Args) => ApiActionConfig<Route>)
    | ((...args: Args) => { config: ApiActionConfig<Route>; meta: Meta })
): ApiActionCreator<Args, Route, Meta> {
  const [requestType, responseType] = makeApiActionTypes(type);

  type NormalizationSchema = ApiActionConfig<Route> extends {
    normalizationSchema: any;
  }
    ? ApiActionConfig<Route>["normalizationSchema"]
    : never;

  // Add apiCallConfig to meta
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
    const apiCallConfig = {
      endpoint,
      fetchInit: {
        method: route.method,
        body,
        requestId: uuidv4(),
      },
      normalizationSchema,
      canSkipRehydrate,
      cancelKey,
    } as ApiCallConfig<Route>;
    const baseMeta = {
      queryStringParams,
      pathParams,
    };
    const meta = "meta" in result ? merge(baseMeta, result.meta) : baseMeta;
    return { payload: apiCallConfig, meta };
  }

  type Response = InferResponseBody<Route> & ApiResponseWrapper;

  const actionCreator = createAction(
    requestType,
    apiActionCreatorPrepare
  ) as unknown as ApiActionCreator<Args, Route, Meta>;

  actionCreator.route = route;

  actionCreator.response = createAction(
    responseType,
    (
      payload: InferResponseBody<Route>,
      meta: ApiResponseActionMeta<NormalizationSchema, Meta>
    ) => ({
      payload,
      meta,
    })
  ) as ActionCreatorWithPreparedPayload<
    unknown[],
    Response,
    string,
    boolean,
    ApiResponseActionMeta<NormalizationSchema, Meta>
  >;
  return actionCreator;
}

type ContinuationQueryStringParams = {
  continuationToken?: string;
  count: string;
  sorts?: string;
};

interface SearchQueryStringParams {
  filters?: string;
  includeUrls?: string;
  sorts?: string;
  count?: string;
  continuationToken?: string;
}

const defaultSorts = `created=${SortDirections.DESCENDING}`;

/** Actions that directly result in API calls */
export const api = {
  fetchProposition: apiActionCreator(
    "FETCH_PROPOSITION",
    serviceRoutes.readProposition,
    (propositionId: EntityId) => ({
      config: {
        pathParams: { propositionId },
        normalizationSchema: { proposition: propositionSchema },
      },
      meta: { propositionId },
    })
  ),
  fetchPropositions: apiActionCreator(
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
  fetchPropositionCompound: apiActionCreator(
    "FETCH_PROPOSITION_COMPOUND",
    serviceRoutes.readPropositionCompound,
    (propositionCompoundId: EntityId) => ({
      pathParams: { propositionCompoundId },
      normalizationSchema: { propositionCompound: propositionCompoundSchema },
    })
  ),
  fetchPropositionRootJustificationTarget: apiActionCreator(
    "FETCH_PROPOSITION_ROOT_JUSTIFICATION_TARGET",
    serviceRoutes.readProposition,
    (propositionId: EntityId) => ({
      config: {
        pathParams: { propositionId },
        queryStringParams: { include: "justifications" },
        normalizationSchema: { proposition: propositionSchema },
      },
      meta: {
        rootTargetId: propositionId,
      },
    })
  ),
  fetchStatementRootJustificationTarget: apiActionCreator(
    "FETCH_STATEMENT_ROOT_JUSTIFICATION_TARGET",
    serviceRoutes.readStatement,
    (statementId: EntityId) => ({
      config: {
        pathParams: { statementId },
        queryStringParams: { include: "justifications" },
        normalizationSchema: { statement: statementSchema },
      },
      meta: {
        rootTargetId: statementId,
      },
    })
  ),

  fetchWritQuote: apiActionCreator(
    "FETCH_WRIT_QUOTE",
    serviceRoutes.readWritQuote,
    (writQuoteId: EntityId) => ({
      pathParams: { writQuoteId },
      normalizationSchema: { writQuote: writQuoteSchema },
    })
  ),
  createWritQuote: apiActionCreator(
    "CREATE_WRIT_QUOTE",
    serviceRoutes.createWritQuote,
    (writQuote: CreateWritQuote) => ({
      body: { writQuote },
      normalizationSchema: { writQuote: writQuoteSchema },
    })
  ),
  updateWritQuote: apiActionCreator(
    "UPDATE_WRIT_QUOTE",
    serviceRoutes.updateWritQuote,
    (writQuote: UpdateWritQuote) => ({
      body: { writQuote },
      pathParams: { writQuoteId: writQuote.id },
      normalizationSchema: { writQuote: writQuoteSchema },
    })
  ),

  createMediaExcerpt: apiActionCreator(
    "CREATE_MEDIA_EXCERPT",
    serviceRoutes.createMediaExcerpt,
    (mediaExcerpt: CreateMediaExcerpt) => ({
      body: { mediaExcerpt },
      normalizationSchema: { mediaExcerpt: mediaExcerptSchema },
    })
  ),
  fetchMediaExcerpt: apiActionCreator(
    "FETCH_MEDIA_EXCERPT",
    serviceRoutes.readMediaExcerpt,
    (mediaExcerptId: EntityId) => ({
      pathParams: { mediaExcerptId },
      normalizationSchema: { mediaExcerpt: mediaExcerptSchema },
    })
  ),
  deleteMediaExcerpt: apiActionCreator(
    "DELETE_MEDIA_EXCERPT",
    serviceRoutes.deleteMediaExcerpt,
    (mediaExcerptId: EntityId) => ({
      pathParams: { mediaExcerptId },
    })
  ),
  fetchMediaExcerpts: apiActionCreator(
    "FETCH_MEDIA_EXCERPTS",
    serviceRoutes.readMediaExcerpts,
    (
      filters: MediaExcerptSearchFilter,
      count: number,
      continuationToken?: ContinuationToken
    ) => {
      const queryStringParams: SearchQueryStringParams = {
        filters: encodeQueryStringObject(filters),
        continuationToken,
        count: toString(count),
      };
      if (!queryStringParams.continuationToken) {
        queryStringParams.sorts = defaultSorts;
      }
      return {
        config: {
          queryStringParams,
          normalizationSchema: { mediaExcerpts: mediaExcerptsSchema },
        },
        meta: { filters },
      };
    }
  ),
  fetchMediaExcerptApparitions: apiActionCreator(
    "FETCH_MEDIA_EXCERPT_APPARITIONS",
    serviceRoutes.readAppearances,
    (mediaExcerptId: EntityId) => ({
      queryStringParams: {
        filters: encodeQueryStringObject({ mediaExcerptId }),
      },
      normalizationSchema: { appearances: appearancesSchema },
    })
  ),

  createAppearance: apiActionCreator(
    "CREATE_APPEARANCE",
    serviceRoutes.createAppearance,
    (appearance: CreateAppearance) => ({
      body: { appearance },
      normalizationSchema: { appearance: appearanceSchema },
    })
  ),
  fetchAppearance: apiActionCreator(
    "FETCH_APPEARANCE",
    serviceRoutes.readAppearance,
    (appearanceId: EntityId) => ({
      pathParams: { appearanceId },
      normalizationSchema: { appearance: appearanceSchema },
    })
  ),
  fetchAppearances: apiActionCreator(
    "FETCH_APPEARANCES",
    serviceRoutes.readAppearances,
    (
      filters: AppearanceSearchFilter,
      count: number,
      continuationToken?: ContinuationToken
    ) => {
      const queryStringParams: SearchQueryStringParams = {
        filters: encodeQueryStringObject(filters),
        continuationToken,
        count: toString(count),
      };
      if (!queryStringParams.continuationToken) {
        queryStringParams.sorts = defaultSorts;
      }
      return {
        config: {
          queryStringParams,
          normalizationSchema: { appearances: appearancesSchema },
        },
        meta: { filters },
      };
    }
  ),

  confirmAppearance: apiActionCreator(
    "CONFIRM_APPEARANCE",
    serviceRoutes.createAppearanceConfirmation,
    (appearanceId: EntityId) => ({
      pathParams: { appearanceId },
      body: { polarity: "POSITIVE" as const },
      normalizationSchema: { appearance: appearanceSchema },
    })
  ),
  disconfirmAppearance: apiActionCreator(
    "DISCONFIRM_APPEARANCE",
    serviceRoutes.createAppearanceConfirmation,
    (appearanceId: EntityId) => ({
      pathParams: { appearanceId },
      body: { polarity: "NEGATIVE" as const },
      normalizationSchema: { appearance: appearanceSchema },
    })
  ),
  unconfirmAppearance: apiActionCreator(
    "UNCONFIRM_APPEARANCE",
    serviceRoutes.deleteAppearanceConfirmation,
    (appearanceId: EntityId) => ({
      pathParams: { appearanceId },
      normalizationSchema: { appearance: appearanceSchema },
    })
  ),
  undisconfirmAppearance: apiActionCreator(
    "UNDISCONFIRM_APPEARANCE",
    serviceRoutes.deleteAppearanceConfirmation,
    (appearanceId: EntityId) => ({
      pathParams: { appearanceId },
      normalizationSchema: { appearance: appearanceSchema },
    })
  ),

  fetchFactCheck: apiActionCreator(
    "FETCH_FACT_CHECK",
    serviceRoutes.readFactCheck,
    (userIds: EntityId[], urlIds: EntityId[], sourceIds: EntityId[]) => ({
      queryStringParams: {
        userIds: userIds.join(","),
        urlIds: urlIds.join(","),
        sourceIds: sourceIds.join(","),
      },
      normalizationSchema: {
        appearances: appearancesSchema,
        users: usersSchema,
        urls: urlsSchema,
        sources: sourcesSchema,
      },
    })
  ),

  createUrlLocators: apiActionCreator(
    "CREATE_URL_LOCATORS",
    serviceRoutes.createUrlLocators,
    ({ mediaExcerptId, urlLocators }: CreateUrlLocatorsInput) => ({
      body: { urlLocators },
      pathParams: { mediaExcerptId },
      normalizationSchema: { urlLocators: urlLocatorsSchema },
    })
  ),
  deleteUrlLocator: apiActionCreator(
    "DELETE_URL_LOCATOR",
    serviceRoutes.deleteUrlLocator,
    ({ id, mediaExcerptId }: UrlLocatorOut) => ({
      config: {
        pathParams: { mediaExcerptId, urlLocatorId: id },
      },
      meta: { mediaExcerptId, urlLocatorId: id },
    })
  ),

  createMediaExcerptCitations: apiActionCreator(
    "CREATE_MEDIA_EXCERPT_CITATIONS",
    serviceRoutes.createMediaExcerptCitations,
    ({ mediaExcerptId, citations }: CreateMediaExcerptCitationsInput) => ({
      body: { citations },
      pathParams: { mediaExcerptId },
      normalizationSchema: {
        citations: mediaExcerptCitationsSchema,
      },
    })
  ),
  deleteMediaExcerptCitation: apiActionCreator(
    "DELETE_MEDIA_EXCERPT_CITATION",
    serviceRoutes.deleteMediaExcerptCitation,
    ({
      mediaExcerptId,
      source: { id: sourceId },
      normalPincite,
    }: MediaExcerptCitationOut) => ({
      config: {
        pathParams: { mediaExcerptId },
        queryStringParams: { sourceId, normalPincite },
      },
      meta: { mediaExcerptId, sourceId, normalPincite },
    })
  ),

  createMediaExcerptSpeakers: apiActionCreator(
    "CREATE_MEDIA_EXCERPT_SPEAKERS",
    serviceRoutes.createMediaExcerptSpeakers,
    ({ mediaExcerptId, speakers }: CreateMediaExcerptSpeakersInput) => ({
      body: { speakers },
      pathParams: { mediaExcerptId },
      normalizationSchema: {
        speakers: mediaExcerptSpeakersSchema,
      },
    })
  ),
  deleteMediaExcerptSpeaker: apiActionCreator(
    "DELETE_MEDIA_EXCERPT_SPEAKER",
    serviceRoutes.deleteMediaExcerptSpeaker,
    ({
      mediaExcerptId,
      persorg: { id: persorgId },
    }: MediaExcerptSpeakerOut) => ({
      config: {
        pathParams: { mediaExcerptId },
        queryStringParams: { persorgId },
      },
      meta: { mediaExcerptId, persorgId },
    })
  ),

  /** @deprecated */
  fetchSourceExcerptParaphrase: apiActionCreator(
    "FETCH_SOURCE_EXCERPT_PARAPHRASE",
    serviceRoutes.readSourceExcerptParaphrase,
    (sourceExcerptParaphraseId: EntityId) => ({
      pathParams: { sourceExcerptParaphraseId },
      normalizationSchema: {
        sourceExcerptParaphrase: sourceExcerptParaphraseSchema,
      },
    })
  ),
  fetchPersorg: apiActionCreator(
    "FETCH_PERSORG",
    serviceRoutes.readPersorg,
    (persorgId: EntityId) => ({
      pathParams: {
        persorgId,
      },
      normalizationSchema: { persorg: persorgSchema },
    })
  ),
  fetchSpeakerStatements: apiActionCreator(
    "FETCH_PERSORG_STATEMENTS",
    serviceRoutes.readSpeakerStatements,
    (persorgId: EntityId) => ({
      pathParams: { persorgId },
      normalizationSchema: { statements: statementsSchema },
    })
  ),
  fetchSpeakerMediaExcerpts: apiActionCreator(
    "FETCH_MEDIA_EXCERPTS_HAVING_SPEAKER",
    serviceRoutes.readMediaExcerpts,
    (speakerPersorgId: EntityId) => ({
      queryStringParams: {
        filters: encodeQueryStringObject({ speakerPersorgId }),
      },
      normalizationSchema: { mediaExcerpts: mediaExcerptsSchema },
    })
  ),
  fetchSentenceStatements: apiActionCreator(
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
  fetchRootPropositionStatements: apiActionCreator(
    "FETCH_ROOT_PROPOSITION_STATEMENTS",
    serviceRoutes.readRootPropositionStatements,
    (rootPropositionId: EntityId) => ({
      queryStringParams: { rootPropositionId },
      normalizationSchema: { statements: statementsSchema },
    })
  ),
  fetchIndirectPropositionStatements: apiActionCreator(
    "FETCH_INDIRECT_PROPOSITION_STATEMENTS",
    serviceRoutes.readIndirectRootPropositionStatements,
    (rootPropositionId) => ({
      queryStringParams: { rootPropositionId, indirect: null },
      normalizationSchema: { statements: statementsSchema },
    })
  ),
  fetchPropositionAppearances: apiActionCreator(
    "FETCH_PROPOSITION_APPEARANCES",
    serviceRoutes.readAppearances,
    (propositionId: EntityId) => ({
      queryStringParams: {
        filters: encodeQueryStringObject({ propositionId }),
      },
      normalizationSchema: { appearances: appearancesSchema },
    })
  ),
  fetchPropositionCompounds: apiActionCreator(
    "FETCH_PROPOSITION_COMPOUNDS",
    serviceRoutes.readPropositionCompounds,
    (propositionId: EntityId) => ({
      queryStringParams: {
        propositionIds: propositionId,
      },
      normalizationSchema: { propositionCompounds: propositionCompoundsSchema },
    })
  ),

  fetchSource: apiActionCreator(
    "FETCH_SOURCE",
    serviceRoutes.readSource,
    (sourceId: EntityId) => ({
      pathParams: { sourceId },
      normalizationSchema: { source: sourceSchema },
    })
  ),
  fetchSourceMediaExcerpts: apiActionCreator(
    "FETCH_SOURCE_MEDIA_EXCERPTS",
    serviceRoutes.readMediaExcerpts,
    (sourceId: EntityId) => ({
      queryStringParams: {
        filters: encodeQueryStringObject({ sourceId }),
        sorts: defaultSorts,
      },
      normalizationSchema: { mediaExcerpts: mediaExcerptsSchema },
    })
  ),
  fetchMoreSourceMediaExcerpts: apiActionCreator(
    "FETCH_MORE_SOURCE_MEDIA_EXCERPTS",
    serviceRoutes.readMediaExcerpts,
    (continuationToken: ContinuationToken) => ({
      queryStringParams: { continuationToken },
      normalizationSchema: { mediaExcerpts: mediaExcerptsSchema },
    })
  ),

  fetchRecentPropositions: apiActionCreator(
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
        config: {
          queryStringParams,
          normalizationSchema: { propositions: propositionsSchema },
        },
        meta: { widgetId },
      };
    }
  ),
  fetchRecentWrits: apiActionCreator(
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
        config: {
          queryStringParams,
          normalizationSchema: { writs: writsSchema },
        },
        meta: { widgetId },
      };
    }
  ),
  fetchRecentWritQuotes: apiActionCreator(
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
        config: {
          queryStringParams,
          normalizationSchema: { writQuotes: writQuotesSchema },
        },
        meta: { widgetId },
      };
    }
  ),
  fetchRecentMediaExcerpts: apiActionCreator(
    "FETCH_RECENT_MEDIA_EXCERPTS",
    serviceRoutes.readMediaExcerpts,
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
        config: {
          queryStringParams,
          normalizationSchema: { mediaExcerpts: mediaExcerptsSchema },
        },
        meta: { widgetId },
      };
    }
  ),
  fetchRecentAppearances: apiActionCreator(
    "FETCH_RECENT_APPEARANCES",
    serviceRoutes.readAppearances,
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
        config: {
          queryStringParams,
          normalizationSchema: { appearances: appearancesSchema },
        },
        meta: { widgetId },
      };
    }
  ),
  fetchRecentJustifications: apiActionCreator(
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
        config: {
          queryStringParams,
          normalizationSchema: { justifications: justificationsSchema },
        },
        meta: { widgetId },
      };
    }
  ),

  createAccountSettings: apiActionCreator(
    "CREATE_ACCOUNT_SETTINGS",
    serviceRoutes.createAccountSettings,
    (accountSettings: CreateAccountSettings) => ({
      body: { accountSettings },
      normalizationSchema: { accountSettings: accountSettingsSchema },
    })
  ),
  fetchAccountSettings: apiActionCreator(
    "FETCH_ACCOUNT_SETTINGS",
    serviceRoutes.readAccountSettings,
    () => ({
      normalizationSchema: {
        accountSettings: accountSettingsSchema,
      },
    })
  ),
  updateAccountSettings: apiActionCreator(
    "UPDATE_ACCOUNT_SETTINGS",
    serviceRoutes.updateAccountSettings,
    (accountSettings: UpdateAccountSettings) => ({
      body: { accountSettings },
      normalizationSchema: { accountSettings: accountSettingsSchema },
    })
  ),

  createContentReport: apiActionCreator(
    "CREATE_CONTENT_REPORT",
    serviceRoutes.createContentReport,
    (contentReport) => ({
      body: { contentReport },
    })
  ),

  fetchJustificationsSearch: apiActionCreator(
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
      continuationToken?: ContinuationToken;
    }) => {
      const queryStringParams: SearchQueryStringParams = {};

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
  login: apiActionCreator("LOGIN", serviceRoutes.login, (credentials) => ({
    body: { credentials },
    normalizationSchema: { user: userSchema },
  })),
  logout: apiActionCreator("LOGOUT", serviceRoutes.logout, () => ({
    normalizationSchema: {},
  })),
  refreshAuth: apiActionCreator(
    "REFRESH_AUTH",
    serviceRoutes.refreshAuth,
    () => ({
      normalizationSchema: { user: userSchema },
    })
  ),

  requestPasswordReset: apiActionCreator(
    "REQUEST_PASSWORD_RESET",
    serviceRoutes.requestPasswordReset,
    (passwordResetRequest: CreatePasswordResetRequest) => ({
      body: { passwordResetRequest },
      normalizationSchema: {},
    })
  ),
  checkPasswordResetRequest: apiActionCreator(
    "CHECK_PASSWORD_RESET_REQUEST",
    serviceRoutes.readPasswordReset,
    (passwordResetCode: string) => ({
      queryStringParams: { passwordResetCode },
      normalizationSchema: { email: nullSchema },
    })
  ),
  confirmPasswordReset: apiActionCreator(
    "CONFIRM_PASSWORD_RESET",
    serviceRoutes.completePasswordReset,
    (passwordResetConfirmation: PasswordResetConfirmation) => ({
      body: {
        passwordResetConfirmation,
      },
      normalizationSchema: { user: userSchema },
    })
  ),

  requestRegistration: apiActionCreator(
    "REQUEST_REGISTRATION",
    serviceRoutes.requestRegistration,
    (registrationRequest) => ({
      body: {
        registrationRequest,
      },
      normalizationSchema: {},
    })
  ),
  checkRegistration: apiActionCreator(
    "CHECK_REGISTRATION",
    serviceRoutes.readRegistrationRequest,
    (registrationCode) => ({
      queryStringParams: { registrationCode },
      normalizationSchema: {},
    })
  ),
  confirmRegistration: apiActionCreator(
    "CONFIRM_REGISTRATION",
    serviceRoutes.register,
    (registrationConfirmation) => ({
      body: { registrationConfirmation },
      normalizationSchema: { user: userSchema },
    })
  ),

  verifyJustification: apiActionCreator(
    "VERIFY_JUSTIFICATION",
    serviceRoutes.createJustificationVote,
    (justification: JustificationView) => {
      const justificationVote = {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.POSITIVE,
      };
      return {
        config: {
          body: {
            justificationVote,
          },
          normalizationSchema: { justificationVote: justificationVoteSchema },
        },
        meta: {
          justificationVote,
          justificationId: justification.id,
          previousJustificationVote: justification.vote,
        },
      };
    }
  ),
  unVerifyJustification: apiActionCreator(
    "UN_VERIFY_JUSTIFICATION",
    serviceRoutes.deleteJustificationVote,
    (justification: JustificationView) => {
      const justificationVote = {
        justificationId: justification.id,
        polarity: JustificationVotePolarities.POSITIVE,
      };
      return {
        config: {
          body: {
            justificationVote,
          },
        },
        meta: {
          justificationVote,
          justificationId: justification.id,
          previousJustificationVote: justification.vote,
        },
      };
    }
  ),
  disverifyJustification: apiActionCreator(
    "DISVERIFY_JUSTIFICATION",
    serviceRoutes.createJustificationVote,
    (justification: JustificationView) => ({
      config: {
        body: {
          justificationVote: {
            justificationId: justification.id,
            polarity: JustificationVotePolarities.NEGATIVE,
          },
        },
        normalizationSchema: { justificationVote: justificationVoteSchema },
      },
      meta: {
        justificationId: justification.id,
        previousJustificationVote: justification.vote,
      },
    })
  ),
  unDisverifyJustification: apiActionCreator(
    "UN_DISVERIFY_JUSTIFICATION",
    serviceRoutes.deleteJustificationVote,
    (justification: JustificationView) => ({
      config: {
        body: {
          justificationVote: {
            justificationId: justification.id,
            polarity: JustificationVotePolarities.NEGATIVE,
          },
        },
      },
      meta: {
        justificationId: justification.id,
        previousJustificationVote: justification.vote,
      },
    })
  ),

  createTag: apiActionCreator(
    "CREATE_TAG",
    serviceRoutes.createTagVote,
    (
      tagTargetType: TaggableEntityType,
      tagTargetId: EntityId,
      tag: Tag,
      tagVote?: TagVoteViewModel
    ) => ({
      config: {
        body: {
          tagVote: {
            targetType: tagTargetType,
            target: {
              id: tagTargetId,
            },
            polarity: TagVotePolarities.POSITIVE,
            tag,
          },
        },
        normalizationSchema: { tagVote: tagVoteSchema },
      },
      meta: { previousTagVote: tagVote },
    })
  ),
  createAntiTag: apiActionCreator(
    "CREATE_ANTI_TAG",
    serviceRoutes.createTagVote,
    (
      tagTargetType: TaggableEntityType,
      tagTargetId: EntityId,
      tag: Tag,
      tagVote?: TagVoteViewModel
    ) => ({
      config: {
        body: {
          tagVote: {
            targetType: tagTargetType,
            target: {
              id: tagTargetId,
            },
            polarity: TagVotePolarities.NEGATIVE,
            tag,
          },
        },
        normalizationSchema: { tagVote: tagVoteSchema },
      },
      meta: { previousTagVote: tagVote },
    })
  ),
  unTag: apiActionCreator(
    "UN_TAG",
    serviceRoutes.deleteTagVote,
    (prevTagVote: PersistedEntity) => ({
      config: {
        pathParams: { tagVoteId: prevTagVote.id },
      },
      meta: {
        prevTagVote,
      },
    })
  ),

  tagProposition: apiActionCreator(
    "TAG_PROPOSITION",
    serviceRoutes.createPropositionTagVote,
    (
      propositionId: EntityId,
      tag: Tag,
      prevPropositionTagVote?: PropositionTagVoteOut
    ) => {
      const propositionTagVote: TagPropositionVote = {
        polarity: PropositionTagVotePolarities.POSITIVE,
        proposition: { id: propositionId },
        tag,
      };
      return {
        config: {
          pathParams: { propositionId, tagId: tag.id },
          body: {
            propositionTagVote,
          },

          normalizationSchema: {
            propositionTagVote: propositionTagVoteSchema,
          },
        },
        meta: { propositionTagVote, prevPropositionTagVote },
      };
    }
  ),
  antiTagProposition: apiActionCreator(
    "ANTI_TAG_PROPOSITION",
    serviceRoutes.createPropositionTagVote,
    (
      propositionId: EntityId,
      tag: Tag,
      prevPropositionTagVote?: PropositionTagVoteOut
    ) => {
      const propositionTagVote: TagPropositionVote = {
        polarity: PropositionTagVotePolarities.NEGATIVE,
        proposition: { id: propositionId },
        tag,
      };
      return {
        config: {
          body: {
            propositionTagVote,
          },

          normalizationSchema: { propositionTagVote: propositionTagVoteSchema },
        },
        meta: { propositionTagVote, prevPropositionTagVote },
      };
    }
  ),
  unTagProposition: apiActionCreator(
    "UN_TAG_PROPOSITION",
    serviceRoutes.deletePropositionTagVote,
    (prevPropositionTagVote: PropositionTagVoteOut) => ({
      config: {
        pathParams: { propositionTagVoteId: prevPropositionTagVote.id },
      },
      meta: {
        prevPropositionTagVote,
      },
    })
  ),

  createProposition: apiActionCreator(
    "CREATE_PROPOSITION",
    serviceRoutes.createProposition,
    (proposition: CreateProposition) => ({
      body: {
        proposition,
      },
      normalizationSchema: { proposition: propositionSchema },
    })
  ),
  updateProposition: apiActionCreator(
    "UPDATE_PROPOSITION",
    serviceRoutes.updateProposition,
    (proposition: UpdateProposition) => ({
      body: { proposition },
      pathParams: { propositionId: proposition.id },
      normalizationSchema: { proposition: propositionSchema },
    })
  ),
  deleteProposition: apiActionCreator(
    "DELETE_PROPOSITION",
    serviceRoutes.deleteProposition,
    (propositionId: EntityId) => ({
      config: {
        pathParams: { propositionId: propositionId },
      },
      meta: { propositionId: propositionId },
    })
  ),

  createStatement: apiActionCreator(
    "CREATE_STATEMENT",
    serviceRoutes.createStatement,
    (statement: CreateStatement) => ({
      body: { statement },
      normalizationSchema: { statement: statementSchema },
    })
  ),

  updatePersorg: apiActionCreator(
    "UPDATE_PERSORG",
    serviceRoutes.updatePersorg,
    (persorg: UpdatePersorg) => ({
      body: { persorg },
      pathParams: { persorgId: persorg.id },
      normalizationSchema: { persorg: persorgSchema },
    })
  ),
  deletePersorg: apiActionCreator(
    "DELETE_PERSORG",
    serviceRoutes.deletePersorg,
    (persorgId: EntityId) => ({
      pathParams: { persorgId: persorgId },
    })
  ),

  updateSource: apiActionCreator(
    "UPDATE_SOURCE",
    serviceRoutes.updateSource,
    (source: UpdateSource) => ({
      body: { source },
      pathParams: { sourceId: source.id },
      normalizationSchema: { source: sourceSchema },
    })
  ),
  deleteSource: apiActionCreator(
    "DELETE_SOURCE",
    serviceRoutes.deleteSource,
    (sourceId: EntityId) => ({
      pathParams: { sourceId: sourceId },
    })
  ),

  fetchPropositionTextSuggestions: apiActionCreator(
    "FETCH_PROPOSITION_TEXT_SUGGESTIONS",
    serviceRoutes.searchPropositions,
    (propositionText: string, suggestionsKey: SuggestionsKey) => ({
      config: {
        queryStringParams: { searchText: propositionText },
        cancelKey:
          makeApiActionTypes("FETCH_PROPOSITION_TEXT_SUGGESTIONS")[0] +
          "." +
          suggestionsKey,
        normalizationSchema: { propositions: propositionsSchema },
      },
      meta: { suggestionsKey, suggestionsResponseKey: "propositions" },
    })
  ),

  fetchWritTitleSuggestions: apiActionCreator(
    "FETCH_WRIT_TITLE_SUGGESTIONS",
    serviceRoutes.searchWrits,
    (writTitle: string, suggestionsKey: string) => ({
      config: {
        queryStringParams: {
          searchText: writTitle,
        },
        cancelKey:
          makeApiActionTypes("FETCH_WRIT_TITLE_SUGGESTIONS")[0] +
          "." +
          suggestionsKey,
        normalizationSchema: { writs: writsSchema },
      },
      meta: { suggestionsKey, suggestionsResponseKey: "writs" },
    })
  ),

  fetchTagNameSuggestions: apiActionCreator(
    "FETCH_TAG_NAME_SUGGESTIONS",
    serviceRoutes.searchTags,
    (tagName: string, suggestionsKey: string) => ({
      config: {
        queryStringParams: {
          searchText: tagName,
        },
        cancelKey:
          makeApiActionTypes("FETCH_TAG_NAME_SUGGESTIONS")[0] +
          "." +
          suggestionsKey,
        normalizationSchema: { tags: tagsSchema },
      },
      meta: { suggestionsKey, suggestionsResponseKey: "tags" },
    })
  ),

  fetchMainSearchSuggestions: apiActionCreator(
    "FETCH_MAIN_SEARCH_SUGGESTIONS",
    serviceRoutes.searchPropositions,
    (searchText: string, suggestionsKey: SuggestionsKey) => ({
      config: {
        queryStringParams: {
          searchText,
        },
        cancelKey:
          makeApiActionTypes("FETCH_MAIN_SEARCH_SUGGESTIONS")[0] +
          "." +
          suggestionsKey,
        normalizationSchema: { propositions: propositionsSchema },
      },
      meta: { suggestionsKey },
    })
  ),

  fetchPersorgNameSuggestions: apiActionCreator(
    "FETCH_PERSORG_NAME_SUGGESTIONS",
    serviceRoutes.searchPersorgs,
    (searchText, suggestionsKey) => ({
      config: {
        queryStringParams: {
          searchText,
        },
        cancelKey: `${
          makeApiActionTypes("FETCH_PERSORG_NAME_SUGGESTIONS")[0]
        }.${suggestionsKey}`,
        normalizationSchema: { persorgs: persorgsSchema },
      },
      meta: { suggestionsKey, suggestionsResponseKey: "persorgs" },
    })
  ),

  fetchSourceDescriptionSuggestions: apiActionCreator(
    "FETCH_SOURCE_DESCRIPTION_SUGGESTIONS",
    serviceRoutes.searchSources,
    (searchText, suggestionsKey) => ({
      config: {
        queryStringParams: {
          searchText,
        },
        cancelKey: `${
          makeApiActionTypes("FETCH_SOURCE_DESCRIPTION_SUGGESTIONS")[0]
        }.${suggestionsKey}`,
        normalizationSchema: { sources: sourcesSchema },
      },
      meta: { suggestionsKey, suggestionsResponseKey: "sources" },
    })
  ),

  createJustification: apiActionCreator(
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
  createCounterJustification: apiActionCreator(
    "CREATE_CONTER_JUSTIFICATION",
    serviceRoutes.createJustification,
    (justification: CreateCounterJustification) => ({
      body: {
        justification,
      },
      normalizationSchema: { justification: justificationSchema },
    })
  ),
  deleteJustification: apiActionCreator(
    "DELETE_JUSTIFICATION",
    serviceRoutes.deleteJustification,
    (justification: JustificationView) => ({
      config: {
        pathParams: { justificationId: justification.id },
      },
      meta: {
        justificationId: justification.id,
        justificationTargetType: justification.target.type,
        justificationTargetId: justification.target.entity.id,
      },
    })
  ),

  fetchMainSearchResults: apiActionCreator(
    "FETCH_MAIN_SEARCH_RESULTS",
    serviceRoutes.mainSearch,
    (searchText) => ({
      queryStringParams: {
        searchText,
      },
      normalizationSchema: mainSearchResultSchema,
    })
  ),

  fetchTag: apiActionCreator("FETCH_TAG", serviceRoutes.readTag, (tagId) => ({
    pathParams: { tagId },
    normalizationSchema: { tag: tagSchema },
  })),
  fetchTaggedPropositions: apiActionCreator(
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

  fetchContextTrail: apiActionCreator(
    "FETCH_CONTEXT_TRAIL",
    serviceRoutes.readContextTrail,
    (contextTrailInfos: ContextTrailItemInfo[]) => ({
      queryStringParams: {
        contextTrailInfos: serializeContextTrail(contextTrailInfos),
      },
      normalizationSchema: { contextTrailItems: contextTrailItemsSchema },
    })
  ),
  inferMediaExcerptInfo: apiActionCreator(
    "INFER_MEDIA_EXCERPT_INFO",
    serviceRoutes.inferMediaExcerptInfo,
    (url: string, quotation: string | undefined) => ({
      queryStringParams: {
        url,
        quotation,
      },
      // TODO(#482) remove normalizationSchema once we can figure out how to type it.
      normalizationSchema: { mediaExcerptInfo: nullSchema },
    })
  ),
  fetchCanonicalUrl: apiActionCreator(
    "FETCH_CANONICAL_URL",
    serviceRoutes.readCanonicalUrl,
    (urlKey: string, url: string) => ({
      config: {
        queryStringParams: {
          url,
        },
        normalizationSchema: { canonicalUrl: nullSchema },
      },
      meta: { urlKey },
    })
  ),

  fetchExplorePageData: apiActionCreator(
    "FETCH_EXPLORE_PAGE_DATA",
    serviceRoutes.readExplorePageData,
    () => ({
      normalizationSchema: {
        tags: tagsSchema,
        domains: domainsSchema,
      },
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
export const cancelSourceDescriptionSuggestions = createAction(
  "CANCEL_SOURCE_DESCRIPTION_SUGGESTIONS",
  (suggestionsKey: SuggestionsKey) => ({
    cancelTarget: makeApiActionTypes("FETCH_SOURCE_DESCRIPTION_SUGGESTIONS")[0],
    cancelTargetArgs: ["", suggestionsKey],
    suggestionsKey,
  })
);

type UnknownApiActionCreator = ApiActionCreator<unknown[], any, unknown>;

export const apiActionCreatorsByActionType = reduce(
  api,
  (result: { [key: string]: UnknownApiActionCreator }, actionCreator) => {
    result[str(actionCreator)] = actionCreator as any;
    return result;
  },
  {}
);

export const allApiResponseActions = Object.values(api).map(
  (actionCreator) => actionCreator.response
);
