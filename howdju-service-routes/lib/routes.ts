import { toNumber, split } from "lodash";
import { Moment } from "moment";
import { z } from "zod";

import {
  decodeQueryStringObject,
  decodeSorts,
  httpMethods,
  JustificationRootTargetTypes,
  WritQuote,
  JustificationSearchFilters,
  CreateProposition,
  UpdateProposition,
  CreateStatement,
  CreateJustification,
  CreateWritQuote,
  UpdateWritQuote,
  Credentials,
  CreatePropositionTagVote,
  CreateUser,
  CreateAccountSettings,
  UpdateAccountSettings,
  CreateContentReport,
  UpdatePersorg,
  CreateJustificationVote,
  DeleteJustificationVote,
  ContinuationToken,
  WritOut,
  AuthToken,
  WritQuoteOut,
  UserOut,
  CreateTagVote,
  newUnimplementedError,
  CreateRegistrationRequest,
  CreateRegistrationConfirmation,
  parseContextTrail,
  toJson,
  CreateMediaExcerpt,
  MediaExcerptSearchFilterKeys,
  isDefined,
  UpdateSource,
  CreateUrlLocator,
  CreateAppearance,
  SentenceTypes,
  SentenceType,
  AppearanceSearchFilterKeys,
  CreateAppearanceConfirmation,
  CreatePasswordResetRequest,
  PasswordResetConfirmation,
  JustificationVoteOut,
  CreateMediaExcerptCitation,
  CreateMediaExcerptSpeaker,
} from "howdju-common";
import {
  AppProvider,
  EntityNotFoundError,
  InvalidLoginError,
  InvalidRequestError,
  prefixErrorPath,
} from "howdju-service-common";

import { Authed, Body, EmptyRequest, PathParams, QueryStringParams } from "./routeSchemas";
import { handler } from "./routeHandler";

export type ServiceRoutes = typeof serviceRoutes;
export type ServiceRoute = ServiceRoutes[keyof ServiceRoutes];

export const serviceRoutes = {
  /*
   * Search
   */
  searchPropositions: {
    path: "search-propositions",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("searchText"),
      async (
        appProvider: AppProvider,
        { authToken, queryStringParams: { searchText } }
      ) => {
        if (!searchText) {
          throw new InvalidRequestError("searchText is required.");
        }
        const propositions = await appProvider.propositionsTextSearcher.search(
          authToken,
          searchText
        );
        return { body: { propositions } };
      }
    ),
  },
  searchTags: {
    path: "search-tags",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("searchText"),
      async (
        appProvider: AppProvider,
        { queryStringParams: { searchText } }
      ) => {
        if (!searchText) {
          return { body: { tags: [] } };
        }
        const tags = await appProvider.tagsService.readTagsLikeTagName(
          searchText
        );
        return { body: { tags } };
      }
    ),
  },
  searchWrits: {
    path: "search-writs",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("searchText"),
      async (
        appProvider: AppProvider,
        { authToken, queryStringParams: { searchText } }
      ) => {
        if (!searchText) {
          throw new InvalidRequestError("searchText is required.");
        }
        const writs = await appProvider.writsTitleSearcher.search(
          authToken,
          searchText
        );
        return { body: { writs } };
      }
    ),
  },
  searchPersorgs: {
    path: "search-persorgs",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("searchText"),
      async (
        appProvider: AppProvider,
        { authToken, queryStringParams: { searchText } }
      ) => {
        if (!searchText) {
          throw new InvalidRequestError("searchText is required.");
        }
        const persorgs = await appProvider.persorgsNameSearcher.search(
          authToken,
          searchText
        );
        return { body: { persorgs } };
      }
    ),
  },
  searchSources: {
    path: "search-sources",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("searchText"),
      async (
        appProvider: AppProvider,
        { authToken, queryStringParams: { searchText } }
      ) => {
        if (!searchText) {
          throw new InvalidRequestError("searchText is required.");
        }
        const sources = await appProvider.sourceDescriptionSearcher.search(
          authToken,
          searchText
        );
        return { body: { sources } };
      }
    ),
  },
  mainSearch: {
    path: "search",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("searchText"),
      async (
        appProvider: AppProvider,
        { authToken, queryStringParams: { searchText } }
      ) => {
        if (!searchText) {
          throw new InvalidRequestError("searchText is required.");
        }
        const results = await appProvider.mainSearchService.search(
          authToken,
          searchText
        );
        return { body: results };
      }
    ),
  },
  readTag: {
    path: "tags/:tagId",
    method: httpMethods.GET,
    request: handler(
      PathParams("tagId"),
      async (appProvider: AppProvider, { pathParams: { tagId } }) => {
        const tag = await appProvider.tagsService.readTagForId(tagId);
        return { body: { tag } };
      }
    ),
  },
  /*
   * Propositions
   */
  readTaggedPropositions: {
    path: "propositions",
    method: httpMethods.GET,
    queryStringParams: { tagId: /.+/ },
    request: handler(
      QueryStringParams("tagId"),
      async (
        appProvider: AppProvider,
        { queryStringParams: { tagId }, authToken }
      ) => {
        if (!tagId) {
          throw new InvalidRequestError("tagId is required.");
        }
        const propositions =
          await appProvider.propositionsService.readPropositionsForTagId(
            tagId,
            {
              authToken,
            }
          );
        return { body: { propositions } };
      }
    ),
  },
  readPropositions: {
    path: "propositions",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams(
        "propositionIds",
        "continuationToken",
        "sorts",
        "count"
      ),
      async (
        appProvider: AppProvider,
        {
          authToken,
          queryStringParams: {
            sorts: encodedSorts,
            continuationToken,
            count: countParam,
            propositionIds: propositionIdsParam,
          },
        }
      ) => {
        const sorts = decodeSorts(encodedSorts);
        const count = toNumber(countParam);
        if (isNaN(count)) {
          throw new InvalidRequestError("count must be a number.");
        }
        if (propositionIdsParam) {
          const propositionIds = split(propositionIdsParam, ",");
          const propositions =
            await appProvider.propositionsService.readPropositionsForIds(
              { authToken },
              propositionIds
            );
          return { body: { propositions } };
        } else {
          const { propositions, continuationToken: newContinuationToken } =
            await appProvider.propositionsService.readPropositions(
              { authToken },
              {
                sorts,
                continuationToken,
                count,
              }
            );
          return {
            body: { propositions, continuationToken: newContinuationToken },
          };
        }
      }
    ),
  },
  createProposition: {
    path: "propositions",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(Body({ proposition: CreateProposition })),
      async (
        appProvider: AppProvider,
        { authToken, body: { proposition: createProposition } }
      ) => {
        const { proposition, isExtant } = await prefixErrorPath(
          appProvider.propositionsService.readOrCreateProposition(
            { authToken },
            createProposition
          ),
          "proposition"
        );
        return { body: { proposition, isExtant } };
      }
    ),
  },
  readProposition: {
    path: "propositions/:propositionId",
    method: httpMethods.GET,
    // explicitly no query string parameters
    queryStringParams: {},
    request: handler(
      PathParams("propositionId"),
      async (
        appProvider: AppProvider,
        { pathParams: { propositionId }, authToken }
      ) => {
        const proposition =
          await appProvider.propositionsService.readPropositionForId(
            propositionId,
            { authToken, userId: undefined }
          );
        return { body: { proposition } };
      }
    ),
  },
  updateProposition: {
    path: "propositions/:propositionId",
    method: httpMethods.PUT,
    request: handler(
      Body({ proposition: UpdateProposition }).merge(Authed),
      async (
        appProvider: AppProvider,
        { authToken, body: { proposition: updateProposition } }
      ) => {
        const proposition = await prefixErrorPath(
          appProvider.propositionsService.updateProposition(
            authToken,
            updateProposition
          ),
          "proposition"
        );
        return { body: { proposition } };
      }
    ),
  },
  deleteProposition: {
    path: "propositions/:propositionId",
    method: httpMethods.DELETE,
    request: handler(
      PathParams("propositionId").merge(Authed),
      async (
        appProvider: AppProvider,
        { authToken, pathParams: { propositionId } }
      ) => {
        await prefixErrorPath(
          appProvider.propositionsService.deleteProposition(
            authToken,
            propositionId
          ),
          "proposition"
        );
      }
    ),
  },
  /*
   * Statements
   */
  createStatement: {
    path: "statements",
    method: httpMethods.POST,
    request: handler(
      Body({ statement: CreateStatement }).merge(Authed),
      async (
        appProvider: AppProvider,
        { authToken, body: { statement: inStatement } }
      ) => {
        const { isExtant, statement } =
          await appProvider.statementsService.readOrCreate(
            inStatement,
            authToken
          );
        return { body: { isExtant, statement } };
      }
    ),
  },
  readSpeakerStatements: {
    path: "persorgs/:persorgId/statements",
    method: httpMethods.GET,
    request: handler(
      PathParams("persorgId"),
      async (appProvider: AppProvider, { pathParams: { persorgId } }) => {
        const statements =
          await appProvider.statementsService.readStatementsForSpeakerPersorgId(
            persorgId
          );
        return { body: { statements } };
      }
    ),
  },
  readSentenceStatements: {
    path: "statements",
    method: httpMethods.GET,
    queryStringParams: {
      sentenceType: /.+/,
      sentenceId: /.+/,
    },
    request: handler(
      QueryStringParams("sentenceType", "sentenceId"),
      async (
        appProvider: AppProvider,
        { queryStringParams: { sentenceType, sentenceId } }
      ) => {
        if (
          !sentenceType ||
          !Object.keys(SentenceTypes).includes(sentenceType)
        ) {
          throw new InvalidRequestError(
            `sentenceType must be one of : ${Object.keys(SentenceTypes)}`
          );
        }
        if (!sentenceId) {
          throw new InvalidRequestError("sentenceId is required");
        }
        const statements =
          await appProvider.statementsService.readStatementsForSentenceTypeAndId(
            sentenceType as SentenceType,
            sentenceId
          );
        return { body: { statements } };
      }
    ),
  },
  readIndirectRootPropositionStatements: {
    path: "statements",
    method: httpMethods.GET,
    queryStringParams: {
      rootPropositionId: /.+/,
      indirect: "",
    },
    request: handler(
      QueryStringParams("rootPropositionId"),
      async (
        appProvider: AppProvider,
        { queryStringParams: { rootPropositionId } }
      ) => {
        if (!rootPropositionId) {
          throw new InvalidRequestError("rootPropositionId is required");
        }
        const statements =
          await appProvider.statementsService.readIndirectStatementsForRootPropositionId(
            rootPropositionId
          );
        return { body: { statements } };
      }
    ),
  },
  readRootPropositionStatements: {
    path: "statements",
    method: httpMethods.GET,
    queryStringParams: {
      rootPropositionId: /.+/,
    },
    request: handler(
      QueryStringParams("rootPropositionId"),
      async (
        appProvider: AppProvider,
        { queryStringParams: { rootPropositionId } }
      ) => {
        if (!rootPropositionId) {
          throw new InvalidRequestError("rootPropositionId is required");
        }
        const statements =
          await appProvider.statementsService.readStatementsForRootPropositionId(
            rootPropositionId
          );
        return { body: { statements } };
      }
    ),
  },
  readStatement: {
    path: "statements/:statementId",
    method: httpMethods.GET,
    // explicitly no query string parameters
    queryStringParams: {},
    request: handler(
      PathParams("statementId"),
      async (
        appProvider: AppProvider,
        { authToken, pathParams: { statementId } }
      ) => {
        const statement =
          await appProvider.statementsService.readStatementForId(
            { authToken },
            statementId
          );
        return { body: { statement } };
      }
    ),
  },

  /*
   * PropositionCompounds
   */
  readPropositionCompounds: {
    path: "proposition-compounds",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("propositionIds"),
      async (
        appProvider: AppProvider,
        { queryStringParams: { propositionIds } }
      ) => {
        if (!propositionIds) {
          throw new InvalidRequestError("propositionIds is required");
        }
        const propositionCompounds =
          await appProvider.propositionCompoundsService.readPropositionCompoundsForPropositionIds(
            split(propositionIds, ",")
          );
        return { body: { propositionCompounds } };
      }
    ),
  },

  /*
   * Persorgs
   */
  readPersorg: {
    path: "persorgs/:persorgId",
    method: httpMethods.GET,
    request: handler(
      PathParams("persorgId"),
      async (appProvider: AppProvider, { pathParams: { persorgId } }) => {
        const persorg = await appProvider.persorgsService.readPersorgForId(
          persorgId
        );
        return { body: { persorg } };
      }
    ),
  },
  updatePersorg: {
    path: "persorgs/:persorgId",
    method: httpMethods.PUT,
    request: handler(
      Authed.merge(Body({ persorg: UpdatePersorg })),
      async (
        appProvider: AppProvider,
        { authToken, body: { persorg: updatePersorg } }
      ) => {
        const persorg = await prefixErrorPath(
          appProvider.persorgsService.update(updatePersorg, authToken),
          "persorg"
        );
        return { body: { persorg } };
      }
    ),
  },
  deletePersorg: {
    path: "persorgs/:persorgId",
    method: httpMethods.DELETE,
    request: handler(
      Authed.merge(PathParams("persorgId")),
      async (
        appProvider: AppProvider,
        { authToken, pathParams: { persorgId } }
      ) => {
        await prefixErrorPath(
          appProvider.persorgsService.delete({ authToken }, persorgId),
          "persorg"
        );
      }
    ),
  },

  /*
   * Sources
   */
  readSource: {
    path: "sources/:sourceId",
    method: httpMethods.GET,
    request: handler(
      PathParams("sourceId"),
      async (appProvider: AppProvider, { pathParams: { sourceId } }) => {
        const source = await appProvider.sourcesService.readSourceForId(
          sourceId
        );
        return { body: { source } };
      }
    ),
  },
  updateSource: {
    path: "sources/:sourceId",
    method: httpMethods.PUT,
    request: handler(
      Authed.merge(Body({ source: UpdateSource })),
      async (
        appProvider: AppProvider,
        { authToken, body: { source: updateSource } }
      ) => {
        const source = await prefixErrorPath(
          appProvider.sourcesService.updateSource({ authToken }, updateSource),
          "source"
        );
        return { body: { source } };
      }
    ),
  },
  deleteSource: {
    path: "sources/:sourceId",
    method: httpMethods.DELETE,
    request: handler(
      Authed.merge(PathParams("sourceId")),
      async (
        appProvider: AppProvider,
        { authToken, pathParams: { sourceId } }
      ) => {
        await prefixErrorPath(
          appProvider.sourcesService.deleteSourceForId({ authToken }, sourceId),
          "source"
        );
      }
    ),
  },

  /*
   * Root target justifications
   */
  readPropositionJustifications: {
    path: "propositions/:propositionId",
    method: httpMethods.GET,
    queryStringParams: {
      include: "justifications",
    },
    request: handler(
      PathParams("propositionId"),
      async (
        appProvider: AppProvider,
        { pathParams: { propositionId }, authToken }
      ) => {
        const proposition =
          await appProvider.rootTargetJustificationsService.readRootTargetWithJustifications(
            JustificationRootTargetTypes.PROPOSITION,
            propositionId,
            authToken
          );
        return { body: { proposition } };
      }
    ),
  },
  readStatementJustifications: {
    path: "statements/:statementId",
    method: httpMethods.GET,
    queryStringParams: {
      include: "justifications",
    },
    request: handler(
      PathParams("statementId"),
      async (
        appProvider: AppProvider,
        { pathParams: { statementId }, authToken }
      ) => {
        const statement =
          await appProvider.rootTargetJustificationsService.readRootTargetWithJustifications(
            JustificationRootTargetTypes.STATEMENT,
            statementId,
            authToken
          );
        return { body: { statement } };
      }
    ),
  },
  /*
   * Proposition compounds
   */
  readPropositionCompound: {
    path: "proposition-compounds/:propositionCompoundId",
    method: httpMethods.GET,
    queryStringParams: {},
    request: handler(
      PathParams("propositionCompoundId"),
      async (
        appProvider: AppProvider,
        { pathParams: { propositionCompoundId } }
      ) => {
        const propositionCompound =
          await appProvider.propositionCompoundsService.readPropositionCompoundForId(
            propositionCompoundId
          );
        return { body: { propositionCompound } };
      }
    ),
  },
  /*
   * Source excerpt paraphrases
   */
  readSourceExcerptParaphrase: {
    path: "source-excerpt-paraphrases/:sourceExcerptParaphraseId",
    method: httpMethods.GET,
    queryStringParams: {},
    request: handler(
      PathParams("sourceExcerptParaphraseId"),
      async (
        appProvider: AppProvider,
        { pathParams: { sourceExcerptParaphraseId }, authToken }
      ) => {
        const sourceExcerptParaphrase =
          await appProvider.sourceExcerptParaphrasesService.readSourceExcerptParaphraseForId(
            sourceExcerptParaphraseId,
            {
              authToken,
            }
          );
        return { body: { sourceExcerptParaphrase } };
      }
    ),
  },
  /*
   * Justifications
   */
  createJustification: {
    path: "justifications",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(Body({ justification: CreateJustification })),
      async (
        appProvider: AppProvider,
        { authToken, body: { justification: createJustification } }
      ) => {
        const { justification, isExtant } = await prefixErrorPath(
          appProvider.justificationsService.readOrCreate(
            createJustification,
            authToken
          ),
          "justification"
        );
        return { body: { justification, isExtant } };
      }
    ),
  },
  readJustifications: {
    path: "justifications",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams(
        "filters",
        "sorts",
        "continuationToken",
        "count",
        "includeUrls"
      ),
      async (
        appProvider: AppProvider,
        {
          queryStringParams: {
            filters: encodedFilters,
            sorts: encodedSorts,
            continuationToken,
            count,
            includeUrls,
          },
        }
      ) => {
        const filters =
          decodeQueryStringObject(encodedFilters) ||
          ({} as JustificationSearchFilters);
        const sorts = decodeSorts(encodedSorts);
        const { justifications, continuationToken: newContinuationToken } =
          await appProvider.justificationsService.readJustifications({
            filters,
            sorts,
            continuationToken,
            count: toNumber(count),
            includeUrls: !!includeUrls,
          });
        return {
          body: { justifications, continuationToken: newContinuationToken },
        };
      }
    ),
  },
  deleteJustification: {
    path: "justifications/:justificationId",
    method: httpMethods.DELETE,
    request: handler(
      Authed.merge(PathParams("justificationId")),
      async (
        appProvider: AppProvider,
        { authToken, pathParams: { justificationId } }
      ) => {
        await prefixErrorPath(
          appProvider.justificationsService.deleteJustification(
            authToken,
            justificationId
          ),
          "justification"
        );
      }
    ),
  },

  /*
   * Context trail
   */
  readContextTrail: {
    path: "context-trails",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("contextTrailInfos"),
      async (
        appProvider: AppProvider,
        { authToken, queryStringParams: { contextTrailInfos } }
      ) => {
        if (!contextTrailInfos) {
          throw new InvalidRequestError("contextTrailInfos is required");
        }
        const { infos, invalidInfos, hasInvalidInfos } =
          parseContextTrail(contextTrailInfos);
        if (hasInvalidInfos) {
          throw new InvalidRequestError(
            `Invalid context trail infos: ${toJson(invalidInfos)}`
          );
        }
        const contextTrailItems =
          await appProvider.contextTrailsService.readContextTrail(
            authToken,
            infos
          );
        return { body: { contextTrailItems } };
      }
    ),
  },

  /*
   * Writ quotes
   */
  createWritQuote: {
    path: "writ-quotes",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(Body({ writQuote: CreateWritQuote })),
      async (
        appProvider: AppProvider,
        { authToken, body: { writQuote: createWritQuote } }
      ) => {
        const { writQuote, alreadyExists } = await prefixErrorPath(
          appProvider.writQuotesService.createWritQuote({
            authToken,
            writQuote: createWritQuote,
          }) as Promise<{ alreadyExists: boolean; writQuote: WritQuote }>,
          "writQuote"
        );
        return { body: { writQuote, alreadyExists } };
      }
    ),
  },
  readWritQuotes: {
    path: "writ-quotes",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("sorts", "continuationToken", "count"),
      async (
        appProvider: AppProvider,
        { queryStringParams: { sorts: encodedSorts, continuationToken, count } }
      ) => {
        const sorts = decodeSorts(encodedSorts);
        const { writQuotes, continuationToken: newContinuationToken } =
          (await appProvider.writQuotesService.readWritQuotes({
            sorts,
            continuationToken,
            count: toNumber(count),
          })) as {
            writQuotes: WritQuoteOut[];
            continuationToken: ContinuationToken;
          };
        return {
          body: { writQuotes, continuationToken: newContinuationToken },
        };
      }
    ),
  },
  readWritQuote: {
    path: "writ-quotes/:writQuoteId",
    method: httpMethods.GET,
    request: handler(
      PathParams("writQuoteId"),
      async (appProvider: AppProvider, { pathParams: { writQuoteId } }) => {
        const writQuote =
          await appProvider.writQuotesService.readWritQuoteForId(writQuoteId);
        return { body: { writQuote } };
      }
    ),
  },
  updateWritQuote: {
    path: "writ-quotes/:writQuoteId",
    method: httpMethods.PUT,
    request: handler(
      Body({ writQuote: UpdateWritQuote })
        .merge(Authed)
        .merge(PathParams("writQuoteId")),
      async (
        appProvider,
        {
          authToken,
          body: { writQuote: updateWritQuote },
          pathParams: { writQuoteId },
        }
      ) => {
        if (writQuoteId !== updateWritQuote.id) {
          throw new InvalidRequestError(
            "WritQuote ID does not match between path and body."
          );
        }
        const writQuote = await prefixErrorPath(
          appProvider.writQuotesService.updateWritQuote({
            authToken,
            writQuote: updateWritQuote,
          }) as Promise<WritQuoteOut>,
          "writQuote"
        );
        return { body: { writQuote } };
      }
    ),
  },
  /*
   * Writs
   */
  readWrits: {
    path: "writs",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("sorts", "continuationToken", "count"),
      async (
        appProvider: AppProvider,
        { queryStringParams: { sorts: encodedSorts, continuationToken, count } }
      ) => {
        const sorts = decodeSorts(encodedSorts);
        const { writs, continuationToken: newContinuationToken } =
          (await appProvider.writsService.readWrits({
            sorts,
            continuationToken,
            count: toNumber(count),
          })) as { writs: WritOut[]; continuationToken: ContinuationToken };
        return {
          body: { writs, continuationToken: newContinuationToken },
        };
      }
    ),
  },

  /*
   * MediaExcerpts
   */
  createMediaExcerpt: {
    path: "media-excerpts",
    method: "POST",
    request: handler(
      Authed.merge(Body({ mediaExcerpt: CreateMediaExcerpt })),
      async (
        appProvider: AppProvider,
        { authToken, body: { mediaExcerpt: createMediaExcerpt } }
      ) => {
        const { isExtant, mediaExcerpt } =
          await appProvider.mediaExcerptsService.readOrCreateMediaExcerpt(
            { authToken },
            createMediaExcerpt
          );
        return {
          body: {
            isExtant,
            mediaExcerpt,
          },
        };
      }
    ),
  },
  readMediaExcerpt: {
    path: "media-excerpts/:mediaExcerptId",
    method: "GET",
    request: handler(
      PathParams("mediaExcerptId"),
      async (appProvider: AppProvider, { pathParams: { mediaExcerptId } }) => {
        const mediaExcerpt =
          await appProvider.mediaExcerptsService.readMediaExcerptForId(
            mediaExcerptId
          );
        if (!mediaExcerpt) {
          throw new EntityNotFoundError("MEDIA_EXCERPT", mediaExcerptId);
        }
        return { body: { mediaExcerpt } };
      }
    ),
  },
  readMediaExcerpts: {
    path: "media-excerpts",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("filters", "sorts", "continuationToken", "count"),
      async (
        appProvider: AppProvider,
        {
          queryStringParams: {
            filters: encodedFilters,
            sorts: encodedSorts,
            continuationToken: prevContinuationToken,
            count,
          },
        }
      ) => {
        const filters = decodeQueryStringObject(
          encodedFilters,
          MediaExcerptSearchFilterKeys
        );

        const sorts = decodeSorts(encodedSorts);
        const { mediaExcerpts, continuationToken } =
          await appProvider.mediaExcerptsService.readMediaExcerpts(
            filters,
            sorts,
            prevContinuationToken,
            isDefined(count) ? toNumber(count) : undefined
          );
        return {
          body: { mediaExcerpts, continuationToken },
        };
      }
    ),
  },
  deleteMediaExcerpt: {
    path: "media-excerpts/:mediaExcerptId",
    method: httpMethods.DELETE,
    request: handler(
      Authed.merge(PathParams("mediaExcerptId")),
      async (
        appProvider: AppProvider,
        { authToken, pathParams: { mediaExcerptId } }
      ) => {
        await appProvider.mediaExcerptsService.deleteMediaExcerpt(
          { authToken },
          mediaExcerptId
        );
      }
    ),
  },
  createUrlLocators: {
    path: "media-excerpts/:mediaExcerptId/url-locators",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(
        PathParams("mediaExcerptId").merge(
          Body({ urlLocators: z.array(CreateUrlLocator) })
        )
      ),
      async (
        appProvider: AppProvider,
        {
          authToken,
          pathParams: { mediaExcerptId },
          body: { urlLocators: createUrlLocators },
        }
      ) => {
        const { urlLocators, isExtant } =
          await appProvider.mediaExcerptsService.createUrlLocators(
            { authToken },
            mediaExcerptId,
            createUrlLocators
          );
        return { body: { urlLocators, isExtant } };
      }
    ),
  },
  deleteUrlLocator: {
    path: "media-excerpts/:mediaExcerptId/url-locators/:urlLocatorId",
    method: httpMethods.DELETE,
    request: handler(
      Authed.merge(PathParams("mediaExcerptId", "urlLocatorId")),
      async (
        appProvider: AppProvider,
        { authToken, pathParams: { mediaExcerptId, urlLocatorId } }
      ) => {
        await appProvider.mediaExcerptsService.deleteUrlLocator(
          { authToken },
          mediaExcerptId,
          urlLocatorId
        );
      }
    ),
  },

  createMediaExcerptCitations: {
    path: "media-excerpts/:mediaExcerptId/citations",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(PathParams("mediaExcerptId")).merge(
        Body({ citations: z.array(CreateMediaExcerptCitation) })
      ),
      async (
        appProvider: AppProvider,
        {
          authToken,
          pathParams: { mediaExcerptId },
          body: { citations: createCitations },
        }
      ) => {
        const { citations, isExtant } =
          await appProvider.mediaExcerptsService.createCitations(
            { authToken },
            mediaExcerptId,
            createCitations
          );
        return { body: { citations, isExtant } };
      }
    ),
  },
  deleteMediaExcerptCitation: {
    path: "media-excerpts/:mediaExcerptId/citations",
    method: httpMethods.DELETE,
    request: handler(
      Authed.merge(PathParams("mediaExcerptId")).merge(
        QueryStringParams("sourceId", "normalPincite")
      ),
      async (
        appProvider: AppProvider,
        {
          authToken,
          pathParams: { mediaExcerptId },
          queryStringParams: { sourceId, normalPincite },
        }
      ) => {
        if (!sourceId) {
          throw new InvalidRequestError("sourceId is required");
        }
        await appProvider.mediaExcerptsService.deleteCitation(
          { authToken },
          { mediaExcerptId, sourceId, normalPincite }
        );
      }
    ),
  },

  createMediaExcerptSpeakers: {
    path: "media-excerpts/:mediaExcerptId/speakers",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(PathParams("mediaExcerptId")).merge(
        Body({ speakers: z.array(CreateMediaExcerptSpeaker) })
      ),
      async (
        appProvider: AppProvider,
        {
          authToken,
          pathParams: { mediaExcerptId },
          body: { speakers: createSpeakers },
        }
      ) => {
        const { speakers, isExtant } =
          await appProvider.mediaExcerptsService.createSpeakers(
            { authToken },
            mediaExcerptId,
            createSpeakers
          );
        return { body: { speakers, isExtant } };
      }
    ),
  },
  deleteMediaExcerptSpeaker: {
    path: "media-excerpts/:mediaExcerptId/speakers",
    method: httpMethods.DELETE,
    request: handler(
      Authed.merge(PathParams("mediaExcerptId")).merge(
        QueryStringParams("persorgId")
      ),
      async (
        appProvider: AppProvider,
        {
          authToken,
          pathParams: { mediaExcerptId },
          queryStringParams: { persorgId },
        }
      ) => {
        if (!persorgId) {
          throw new InvalidRequestError("persorgId is required");
        }
        await appProvider.mediaExcerptsService.deleteSpeaker(
          { authToken },
          { mediaExcerptId, persorgId }
        );
      }
    ),
  },

  /*
   * Appearances
   */
  createAppearance: {
    path: "appearances",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(Body({ appearance: CreateAppearance })),
      async (
        appProvider: AppProvider,
        { authToken, body: { appearance: createAppearance } }
      ) => {
        const { appearance, isExtant } =
          await appProvider.appearancesService.createAppearance(
            { authToken },
            createAppearance
          );
        return { body: { appearance, isExtant } };
      }
    ),
  },
  readAppearance: {
    path: "appearances/:appearanceId",
    method: httpMethods.GET,
    request: handler(
      PathParams("appearanceId"),
      async (
        appProvider: AppProvider,
        { authToken, pathParams: { appearanceId } }
      ) => {
        const appearance =
          await appProvider.appearancesService.readAppearanceForId(
            { authToken },
            appearanceId
          );
        return { body: { appearance } };
      }
    ),
  },
  readAppearances: {
    path: "appearances",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("filters", "sorts", "continuationToken", "count"),
      async (
        appProvider: AppProvider,
        {
          authToken,
          queryStringParams: {
            filters: encodedFilters,
            sorts: encodedSorts,
            continuationToken: prevContinuationToken,
            count,
          },
        }
      ) => {
        const filters = decodeQueryStringObject(
          encodedFilters,
          AppearanceSearchFilterKeys
        );

        const sorts = decodeSorts(encodedSorts);
        const { appearances, continuationToken } =
          await appProvider.appearancesService.readAppearances(
            { authToken },
            filters,
            sorts,
            prevContinuationToken,
            isDefined(count) ? toNumber(count) : undefined
          );
        return {
          body: { appearances, continuationToken },
        };
      }
    ),
  },

  /*
   * Appearance Confirmations
   */
  createAppearanceConfirmation: {
    path: "appearances/:appearanceId/confirmations",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(
        PathParams("appearanceId").merge(
          Body(
            CreateAppearanceConfirmation.omit({
              appearanceId: true,
            }).shape
          )
        )
      ),
      async (
        appProvider: AppProvider,
        { authToken, pathParams: { appearanceId }, body: createConfirmation }
      ) => {
        const confirmationStatus =
          await appProvider.appearanceConfirmationsService.createAppearanceConfirmation(
            { authToken },
            { ...createConfirmation, appearanceId }
          );
        return {
          body: {
            appearance: {
              id: appearanceId,
              confirmationStatus,
            },
          },
        };
      }
    ),
  },
  deleteAppearanceConfirmation: {
    path: "appearances/:appearanceId/confirmations",
    method: httpMethods.DELETE,
    request: handler(
      Authed.merge(PathParams("appearanceId")),
      async (
        appProvider: AppProvider,
        { authToken, pathParams: { appearanceId } }
      ) => {
        await appProvider.appearanceConfirmationsService.deleteAppearanceConfirmation(
          { authToken },
          appearanceId
        );
        return {
          body: {
            appearance: {
              id: appearanceId,
              confirmationStatus: null,
            },
          },
        };
      }
    ),
  },

  /*
   * FactChecks
   */
  readFactCheck: {
    path: "fact-checks",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("userIds", "urlIds", "sourceIds"),
      async (
        appProvider: AppProvider,
        { authToken, queryStringParams: { userIds, urlIds, sourceIds } }
      ) => {
        if (!userIds) {
          throw new InvalidRequestError("Missing userIds");
        }
        if (!urlIds && !sourceIds) {
          throw new InvalidRequestError(
            "One of urlIds or sourceIds is required."
          );
        }
        const { appearances, users, urls, sources } =
          await appProvider.factChecksService.readFactCheck(
            { authToken },
            userIds.split(","),
            urlIds?.split(",") ?? [],
            sourceIds?.split(",") ?? []
          );
        return {
          body: { appearances, users: users, urls, sources },
        };
      }
    ),
  },

  /*
   * Auth
   */
  login: {
    path: "login",
    method: httpMethods.POST,
    request: handler(
      Body({ credentials: Credentials }),
      async (appProvider: AppProvider, { body: { credentials } }) => {
        try {
          const { user, authToken, expires } =
            (await appProvider.authService.login(credentials)) as {
              user: UserOut;
              authToken: AuthToken;
              expires: Moment;
            };
          return { body: { user, authToken, expires } };
        } catch (err) {
          if (err instanceof EntityNotFoundError) {
            // Hide EntityNotFoundError to prevent someone from learning that an email does or does not correspond to an account
            throw new InvalidLoginError();
          }
          throw err;
        }
      }
    ),
  },
  logout: {
    path: "logout",
    method: httpMethods.POST,
    request: handler(
      Authed,
      async (appProvider: AppProvider, { authToken }) => {
        await appProvider.authService.logout(authToken);
      }
    ),
  },
  requestPasswordReset: {
    path: "password-reset-requests",
    method: httpMethods.POST,
    request: handler(
      Body({ passwordResetRequest: CreatePasswordResetRequest }),
      async (appProvider: AppProvider, { body: { passwordResetRequest } }) => {
        const duration = await appProvider.passwordResetService.createRequest(
          passwordResetRequest
        );
        return { body: { duration } };
      }
    ),
  },
  readPasswordReset: {
    path: "password-reset-requests",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("passwordResetCode"),
      async (
        appProvider: AppProvider,
        { queryStringParams: { passwordResetCode } }
      ) => {
        if (!passwordResetCode) {
          throw new InvalidRequestError("passwordResetCode is required");
        }
        const email =
          await appProvider.passwordResetService.checkRequestForCode(
            passwordResetCode
          );
        return { body: { email } };
      }
    ),
  },
  completePasswordReset: {
    path: "password-resets",
    method: httpMethods.POST,
    request: handler(
      Body({
        passwordResetConfirmation: PasswordResetConfirmation,
      }),
      async (
        appProvider: AppProvider,
        { body: { passwordResetConfirmation } }
      ) => {
        const { user, authToken, expires } =
          (await appProvider.passwordResetService.resetPasswordAndLogin(
            passwordResetConfirmation
          )) as { user: UserOut; authToken: AuthToken; expires: Moment };
        return { body: { user, authToken, expires } };
      }
    ),
  },
  requestRegistration: {
    path: "registration-requests",
    method: httpMethods.POST,
    request: handler(
      Body({ registrationRequest: CreateRegistrationRequest }),
      async (appProvider: AppProvider, { body: { registrationRequest } }) => {
        const duration = await prefixErrorPath(
          appProvider.registrationService.createRequest(registrationRequest),
          "registrationRequest"
        );
        return { body: { duration } };
      }
    ),
  },
  readRegistrationRequest: {
    path: "registration-requests",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("registrationCode"),
      async (
        appProvider: AppProvider,
        { queryStringParams: { registrationCode } }
      ) => {
        const email =
          (await appProvider.registrationService.checkRequestForCode(
            registrationCode
          )) as string;
        return { body: { email } };
      }
    ),
  },
  register: {
    path: "registrations",
    method: httpMethods.POST,
    request: handler(
      Body({ registrationConfirmation: CreateRegistrationConfirmation }),
      async (
        appProvider: AppProvider,
        { body: { registrationConfirmation } }
      ) => {
        const { user, authToken, expires } = (await prefixErrorPath(
          appProvider.registrationService.confirmRegistrationAndLogin(
            registrationConfirmation
          ),
          "registrationConfirmation"
        )) as { user: UserOut; authToken: AuthToken; expires: Moment };

        return { body: { user, authToken, expires } };
      }
    ),
  },
  /*
   * Votes
   */
  createJustificationVote: {
    path: "justification-votes",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(Body({ justificationVote: CreateJustificationVote })),
      async (
        appProvider: AppProvider,
        { body: { justificationVote: createJustificationVote }, authToken }
      ) => {
        const justificationVote =
          (await appProvider.justificationVotesService.createVote(
            authToken,
            createJustificationVote
          )) as JustificationVoteOut;

        return { body: { justificationVote } };
      }
    ),
  },
  deleteJustificationVote: {
    path: "justification-votes",
    method: httpMethods.DELETE,
    request: handler(
      Authed.merge(Body({ justificationVote: DeleteJustificationVote })),
      async (
        appProvider: AppProvider,
        { body: { justificationVote }, authToken }
      ) => {
        await appProvider.justificationVotesService.deleteVote(
          authToken,
          justificationVote
        );
      }
    ),
  },
  createTagVote: {
    path: "tag-votes",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(Body({ tagVote: CreateTagVote })),
      (_appProvider): Promise<void> => {
        throw newUnimplementedError("createTagVote is not implemented");
      }
    ),
  },
  deleteTagVote: {
    path: "tag-votes",
    method: httpMethods.DELETE,
    request: handler(
      Authed.merge(PathParams("tagVoteId")),
      (_appProvider): Promise<void> => {
        throw newUnimplementedError("deleteTagVote is not implemented");
      }
    ),
  },
  createPropositionTagVote: {
    path: "proposition-tag-votes",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(Body({ propositionTagVote: CreatePropositionTagVote })),
      async (
        appProvider: AppProvider,
        { body: { propositionTagVote: createPropositionTagVote }, authToken }
      ) => {
        const propositionTagVote =
          await appProvider.propositionsService.readOrCreatePropositionTagVote(
            authToken,
            createPropositionTagVote
          );
        return {
          body: {
            propositionTagVote,
          },
        };
      }
    ),
  },
  deletePropositionTagVote: {
    path: "proposition-tag-votes/:propositionTagVoteId",
    method: httpMethods.DELETE,
    request: handler(
      PathParams("propositionTagVoteId").merge(Authed),
      async (
        appProvider: AppProvider,
        { pathParams: { propositionTagVoteId }, authToken }
      ) => {
        await appProvider.propositionTagVotesService.deletePropositionTagVoteForId(
          authToken,
          propositionTagVoteId
        );
      }
    ),
  },
  /*
   * Users
   */
  createUser: {
    path: "users",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(Body({ user: CreateUser })),
      async (
        appProvider: AppProvider,
        { authToken, body: { user: createUser } }
      ) => {
        const user = await appProvider.usersService.createUserAsAuthToken(
          authToken,
          createUser
        );
        return { body: { user } };
      }
    ),
  },
  /*
   * Account settings
   */
  createAccountSettings: {
    path: "account-settings",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(Body({ accountSettings: CreateAccountSettings })),
      async (
        appProvider: AppProvider,
        { authToken, body: { accountSettings: createAccountSettings } }
      ) => {
        const accountSettings =
          await appProvider.accountSettingsService.createAccountSettings(
            authToken,
            createAccountSettings
          );
        return { body: { accountSettings } };
      }
    ),
  },
  readAccountSettings: {
    path: "account-settings",
    method: httpMethods.GET,
    request: handler(
      Authed,
      async (appProvider: AppProvider, { authToken }) => {
        const accountSettings =
          await appProvider.accountSettingsService.readOrCreateAccountSettings(
            authToken
          );
        return { body: { accountSettings } };
      }
    ),
  },
  updateAccountSettings: {
    path: "account-settings",
    method: httpMethods.PUT,
    request: handler(
      Authed.merge(Body({ accountSettings: UpdateAccountSettings })),
      async (
        appProvider: AppProvider,
        { authToken, body: { accountSettings: updateAccountSettings } }
      ) => {
        const accountSettings = await appProvider.accountSettingsService.update(
          updateAccountSettings,
          authToken
        );
        return { body: { accountSettings } };
      }
    ),
  },
  /*
   * Content reports
   */
  createContentReport: {
    path: "content-reports",
    method: httpMethods.POST,
    request: handler(
      Body({ contentReport: CreateContentReport }),
      async (
        appProvider: AppProvider,
        { authToken, body: { contentReport } }
      ) => {
        await appProvider.contentReportsService.createContentReport(
          authToken,
          contentReport
        );
      }
    ),
  },

  /*
   * MediaExcerptInfo
   */
  inferMediaExcerptInfo: {
    path: "media-excerpt-info",
    method: httpMethods.GET,
    request: handler(
      // Require auth to prevent abuse
      Authed.merge(QueryStringParams("url", "quotation")),
      async (
        appProvider: AppProvider,
        { queryStringParams: { url, quotation } }
      ) => {
        if (!url) {
          throw new InvalidRequestError("url is required.");
        }
        const mediaExcerptInfo =
          await appProvider.mediaExcerptInfosService.inferMediaExcerptInfo(
            url,
            quotation
          );
        return { body: { mediaExcerptInfo } };
      }
    ),
  },

  /** Canonical URLs */
  readCanonicalUrl: {
    path: "canonical-urls",
    method: httpMethods.GET,
    request: handler(
      Authed.merge(QueryStringParams("url")),
      async (appProvider: AppProvider, { queryStringParams: { url } }) => {
        if (!url) {
          throw new InvalidRequestError("url is required.");
        }
        const canonicalUrl =
          await appProvider.canonicalUrlsService.readOrFetchCanonicalUrl(url);
        return { body: { canonicalUrl } };
      }
    ),
  },

  readExplorePageData: {
    path: "explore-page",
    method: httpMethods.GET,
    request: handler(EmptyRequest, async (appProvider: AppProvider) => {
      const [tags, domains] = await Promise.all([
        appProvider.tagsService.readAllTags(),
        appProvider.urlsService.readAllDomains(),
      ]);
      return { body: { tags, domains } };
    }),
  },
} as const;
