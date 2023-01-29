import assign from "lodash/assign";
import forEach from "lodash/forEach";
import isEmpty from "lodash/isEmpty";
import isUndefined from "lodash/isUndefined";
import split from "lodash/split";
import { toNumber } from "lodash";

import {
  apiErrorCodes,
  decodeQueryStringObject,
  decodeSorts,
  httpMethods,
  JustificationRootTargetTypes,
  HttpMethod,
  AuthToken,
  toJson,
  Proposition,
  WritQuote,
  JustificationSearchFilters,
} from "howdju-common";
import {
  AuthenticationError,
  AuthorizationError,
  EntityConflictError,
  EntityNotFoundError,
  EntityValidationError,
  InvalidLoginError,
  NoMatchingRouteError,
  RegistrationAlreadyConsumedError,
  RegistrationExpiredError,
  RequestValidationError,
  UserActionsConflictError,
  UserIsInactiveError,
  prefixErrorPath,
} from "howdju-service-common";

import {
  badRequest,
  conflict,
  error,
  notFound,
  ok,
  unauthenticated,
  unauthorized,
} from "./responses";
import { AppProvider } from "./init";
import { Callback } from "./types";

type Route = {
  id: string;
  method: HttpMethod;
  path?: string | RegExp;
  /** Limits the handler to routes matching these parameters */
  queryStringParameters?: Record<string, string | RegExp>;
  handler: Handler;
};

type Handler = (
  appProvider: AppProvider,
  { callback, request }: { callback: Callback; request: Request }
) => ReturnType<typeof callback>;

export type Request = {
  path: string;
  method: HttpMethod;
  queryStringParameters: Record<string, string | undefined>;
  pathParameters: string[];
  authToken: AuthToken | undefined;
  // TODO(1) add a generic parameter `Body extends Record<string, any>`.
  body: Record<string, any>;
};

export const routes: Route[] = [
  /*
   * Options
   */
  {
    id: "options",
    method: httpMethods.OPTIONS,
    handler: (_appProvider, { callback }) => ok({ callback }),
  },

  /*
   * Search
   */
  {
    id: "searchPropositions",
    path: "search-propositions",
    method: httpMethods.GET,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          queryStringParameters: { searchText },
        },
      }
    ) => {
      const rankedPropositions =
        await appProvider.propositionsTextSearcher.search(searchText);
      return ok({ callback, body: rankedPropositions });
    },
  },
  {
    id: "searchTags",
    path: "search-tags",
    method: httpMethods.GET,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          queryStringParameters: { searchText },
        },
      }
    ) => {
      const rankedPropositions =
        await appProvider.tagsService.readTagsLikeTagName(searchText);
      return ok({ callback, body: rankedPropositions });
    },
  },
  {
    id: "searchWrits",
    path: "search-writs",
    method: httpMethods.GET,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          queryStringParameters: { searchText },
        },
      }
    ) => {
      const rankedWrits = await appProvider.writsTitleSearcher.search(
        searchText
      );
      return ok({ callback, body: rankedWrits });
    },
  },
  {
    id: "searchPersorgs",
    path: "search-persorgs",
    method: httpMethods.GET,
    async handler(
      appProvider,
      {
        callback,
        request: {
          queryStringParameters: { searchText },
        },
      }
    ) {
      const rankedPersorgs = await appProvider.persorgsNameSearcher.search(
        searchText
      );
      return ok({ callback, body: rankedPersorgs });
    },
  },
  {
    id: "mainSearch",
    path: "search",
    method: httpMethods.GET,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          queryStringParameters: { searchText },
        },
      }
    ) => {
      const results = await appProvider.mainSearchService.search(searchText);
      return ok({ callback, body: results });
    },
  },

  {
    id: "readTag",
    path: new RegExp("^tags/([^/]+)$"),
    method: httpMethods.GET,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          pathParameters: [tagId],
        },
      }
    ) => {
      const tag = await appProvider.tagsService.readTagForId(tagId);
      return ok({ callback, body: { tag } });
    },
  },

  /*
   * Propositions
   */
  {
    id: "readTaggedPropositions",
    path: "propositions",
    method: httpMethods.GET,
    queryStringParameters: { tagId: /.+/ },
    handler: async (
      appProvider,
      {
        request: {
          queryStringParameters: { tagId },
          authToken,
        },
        callback,
      }
    ) => {
      const propositions =
        await appProvider.propositionsService.readPropositionsForTagId(tagId, {
          authToken,
        });
      return ok({ callback, body: { propositions } });
    },
  },
  {
    id: "readPropositions",
    path: "propositions",
    method: httpMethods.GET,
    handler: async (appProvider, { request, callback }) => {
      const {
        sorts: encodedSorts,
        continuationToken,
        count,
        propositionIds: propositionIdsParam,
      } = request.queryStringParameters;
      const sorts = decodeSorts(encodedSorts);
      if (propositionIdsParam) {
        const propositionIds = split(propositionIdsParam, ",");
        const propositions =
          await appProvider.propositionsService.readPropositionsForIds(
            propositionIds
          );
        return ok({ callback, body: { propositions } });
      } else {
        const { propositions, continuationToken: newContinuationToken } =
          await appProvider.propositionsService.readPropositions({
            sorts,
            continuationToken: continuationToken as any,
            count: count as any,
          });
        return ok({
          callback,
          body: { propositions, continuationToken: newContinuationToken },
        });
      }
    },
  },
  {
    id: "createProposition",
    path: "propositions",
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          authToken,
          body: { proposition: createProposition },
        },
      }
    ) => {
      const { proposition, isExtant } = await prefixErrorPath(
        appProvider.propositionsService.readOrCreateProposition(
          authToken,
          createProposition
        ) as Promise<{ isExtant: boolean; proposition: Proposition }>,
        "proposition"
      );
      return ok({ callback, body: { proposition, isExtant } });
    },
  },
  {
    id: "readProposition",
    path: new RegExp("^propositions/([^/]+)$"),
    method: httpMethods.GET,
    // explicitly no query string parameters
    queryStringParameters: {},
    handler: async (
      appProvider,
      {
        callback,
        request: {
          pathParameters: [propositionId],
          authToken,
        },
      }
    ) => {
      const proposition =
        await appProvider.propositionsService.readPropositionForId(
          propositionId,
          { authToken, userId: undefined }
        );
      return ok({ callback, body: { proposition } });
    },
  },
  {
    id: "updateProposition",
    path: new RegExp("^propositions/([^/]+)$"),
    method: httpMethods.PUT,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          authToken,
          body: { proposition: updateProposition },
        },
      }
    ) => {
      const proposition = await prefixErrorPath(
        appProvider.propositionsService.updateProposition(
          authToken,
          updateProposition
        ),
        "proposition"
      );
      return ok({ callback, body: { proposition } });
    },
  },
  {
    id: "deleteProposition",
    path: new RegExp("^propositions/([^/]+)$"),
    method: httpMethods.DELETE,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          authToken,
          pathParameters: [propositionId],
        },
      }
    ) => {
      await prefixErrorPath(
        appProvider.propositionsService.deleteProposition(
          authToken,
          propositionId
        ),
        "proposition"
      );
      return ok({ callback });
    },
  },

  /*
   * Statements
   */
  {
    id: "createStatement",
    path: new RegExp("^statements$"),
    method: httpMethods.POST,
    async handler(
      appProvider,
      {
        callback,
        request: {
          authToken,
          body: { statement: inStatement },
        },
      }
    ) {
      const { isExtant, statement } =
        await appProvider.statementsService.readOrCreate(
          inStatement,
          authToken
        );
      return ok({ callback, body: { isExtant, statement } });
    },
  },
  {
    id: "readSpeakerStatements",
    path: "statements",
    method: httpMethods.GET,
    queryStringParameters: { speakerPersorgId: /.+/ },
    async handler(
      appProvider,
      {
        callback,
        request: {
          queryStringParameters: { speakerPersorgId },
        },
      }
    ) {
      const statements =
        await appProvider.statementsService.readStatementsForSpeakerPersorgId(
          speakerPersorgId
        );
      return ok({ callback, body: { statements } });
    },
  },
  {
    id: "readSentenceStatements",
    path: "statements",
    method: httpMethods.GET,
    queryStringParameters: {
      sentenceType: /.+/,
      sentenceId: /.+/,
    },
    async handler(
      appProvider,
      {
        callback,
        request: {
          queryStringParameters: { sentenceType, sentenceId },
        },
      }
    ) {
      const statements =
        await appProvider.statementsService.readStatementsForSentenceTypeAndId(
          sentenceType,
          sentenceId
        );
      return ok({ callback, body: { statements } });
    },
  },
  {
    id: "readIndirectRootPropositionStatements",
    path: "statements",
    method: httpMethods.GET,
    queryStringParameters: {
      rootPropositionId: /.+/,
      indirect: "",
    },
    async handler(
      appProvider,
      {
        callback,
        request: {
          queryStringParameters: { rootPropositionId },
        },
      }
    ) {
      const statements =
        await appProvider.statementsService.readIndirectStatementsForRootPropositionId(
          rootPropositionId
        );
      return ok({ callback, body: { statements } });
    },
  },
  {
    id: "readRootPropositionStatements",
    path: "statements",
    method: httpMethods.GET,
    queryStringParameters: {
      rootPropositionId: /.+/,
    },
    async handler(
      appProvider,
      {
        callback,
        request: {
          queryStringParameters: { rootPropositionId },
        },
      }
    ) {
      const statements =
        await appProvider.statementsService.readStatementsForRootPropositionId(
          rootPropositionId
        );
      return ok({ callback, body: { statements } });
    },
  },
  {
    id: "readStatement",
    path: new RegExp("^statements/([^/]+)$"),
    method: httpMethods.GET,
    // explicitly no query string parameters
    queryStringParameters: {},
    async handler(
      appProvider,
      {
        callback,
        request: {
          pathParameters: [statementId],
        },
      }
    ) {
      const { statement } =
        await appProvider.statementsService.readStatementForId(statementId);
      return ok({ callback, body: { statement } });
    },
  },

  /*
   * Persorgs
   */
  {
    id: "readPersorg",
    path: new RegExp("^persorgs/([^/]+)$"),
    method: httpMethods.GET,
    async handler(
      appProvider,
      {
        callback,
        request: {
          pathParameters: [persorgId],
        },
      }
    ) {
      const persorg = await appProvider.persorgsService.readPersorgForId(
        persorgId
      );
      return ok({ callback, body: { persorg } });
    },
  },
  {
    id: "updatePersorg",
    path: new RegExp("^persorgs/([^/]+)$"),
    method: httpMethods.PUT,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          authToken,
          body: { persorg: updatePersorg },
        },
      }
    ) => {
      const persorg = await prefixErrorPath(
        appProvider.persorgsService.update(updatePersorg, authToken),
        "persorg"
      );
      return ok({ callback, body: { persorg } });
    },
  },

  /*
   * Root target justifications
   */
  {
    id: "readPropositionJustifications",
    path: new RegExp("^propositions/([^/]+)$"),
    method: httpMethods.GET,
    queryStringParameters: {
      include: "justifications",
    },
    handler: async (
      appProvider,
      {
        callback,
        request: {
          pathParameters: [propositionId],
          authToken,
        },
      }
    ) => {
      const proposition =
        await appProvider.rootTargetJustificationsService.readRootTargetWithJustifications(
          JustificationRootTargetTypes.PROPOSITION,
          propositionId,
          authToken
        );
      return ok({ callback, body: { proposition } });
    },
  },
  {
    id: "readStatementJustifications",
    path: new RegExp("^statements/([^/]+)$"),
    method: httpMethods.GET,
    queryStringParameters: {
      include: "justifications",
    },
    handler: async (
      appProvider,
      {
        callback,
        request: {
          pathParameters: [statementId],
          authToken,
        },
      }
    ) => {
      const statement =
        await appProvider.rootTargetJustificationsService.readRootTargetWithJustifications(
          JustificationRootTargetTypes.STATEMENT,
          statementId,
          authToken
        );
      return ok({ callback, body: { statement } });
    },
  },

  /*
   * Proposition compounds
   */
  {
    id: "readPropositionCompound",
    path: new RegExp("^proposition-compounds/([^/]+)$"),
    method: httpMethods.GET,
    queryStringParameters: {},
    handler: async (
      appProvider,
      {
        callback,
        request: {
          pathParameters: [propositionCompoundId],
          authToken,
        },
      }
    ) => {
      const propositionCompound =
        await appProvider.propositionCompoundsService.readPropositionCompoundForId(
          propositionCompoundId,
          { authToken }
        );
      return ok({ callback, body: { propositionCompound } });
    },
  },

  /*
   * Source excerpt paraphrases
   */
  {
    id: "readSourceExcerptParaphrase",
    path: new RegExp("^source-excerpt-paraphrases/([^/]+)$"),
    method: httpMethods.GET,
    queryStringParameters: {},
    handler: async (
      appProvider,
      {
        callback,
        request: {
          pathParameters: [sourceExcerptParaphraseId],
          authToken,
        },
      }
    ) => {
      const sourceExcerptParaphrase =
        await appProvider.sourceExcerptParaphrasesService.readSourceExcerptParaphraseForId(
          sourceExcerptParaphraseId,
          {
            authToken,
          }
        );
      return ok({ callback, body: { sourceExcerptParaphrase } });
    },
  },

  /*
   * Justifications
   */
  {
    id: "createJustification",
    path: "justifications",
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          authToken,
          body: { justification: createJustification },
        },
      }
    ) => {
      const { justification, isExtant } = await prefixErrorPath(
        appProvider.justificationsService.readOrCreate(
          createJustification,
          authToken
        ),
        "justification"
      );
      return ok({ callback, body: { justification, isExtant } });
    },
  },
  {
    id: "readJustifications",
    path: "justifications",
    method: httpMethods.GET,
    handler: async (appProvider, { request, callback }) => {
      const {
        filters: encodedFilters,
        sorts: encodedSorts,
        continuationToken,
        count,
        includeUrls,
      } = request.queryStringParameters;
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
      return ok({
        callback,
        body: { justifications, continuationToken: newContinuationToken },
      });
    },
  },
  {
    id: "deleteJustification",
    path: new RegExp("^justifications/([^/]+)$"),
    method: httpMethods.DELETE,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          authToken,
          pathParameters: [justificationId],
        },
      }
    ) => {
      await prefixErrorPath(
        appProvider.justificationsService.deleteJustification(
          authToken,
          justificationId
        ),
        "justification"
      );
      return ok({ callback });
    },
  },

  /*
   * Writ quotes
   */
  {
    id: "createWritQuote",
    path: "writ-quotes",
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          authToken,
          body: { writQuote: createWritQuote },
        },
      }
    ) => {
      const { writQuote, alreadyExists } = await prefixErrorPath(
        appProvider.writQuotesService.createWritQuote({
          authToken,
          writQuote: createWritQuote,
        }) as Promise<{ alreadyExists: boolean; writQuote: WritQuote }>,
        "writQuote"
      );
      return ok({ callback, body: { writQuote, alreadyExists } });
    },
  },
  {
    id: "readWritQuotes",
    path: "writ-quotes",
    method: httpMethods.GET,
    handler: async (appProvider, { request, callback }) => {
      const {
        sorts: encodedSorts,
        continuationToken,
        count,
      } = request.queryStringParameters;
      const sorts = decodeSorts(encodedSorts);
      const { writQuotes, continuationToken: newContinuationToken } =
        await appProvider.writQuotesService.readWritQuotes({
          sorts,
          continuationToken,
          count: toNumber(count),
        });
      return ok({
        callback,
        body: { writQuotes, continuationToken: newContinuationToken },
      });
    },
  },
  {
    id: "readWritQuote",
    path: new RegExp("^writ-quotes/([^/]+)$"),
    method: httpMethods.GET,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          pathParameters: [writQuoteId],
          authToken,
        },
      }
    ) => {
      const writQuote = await appProvider.writQuotesService.readWritQuoteForId(
        writQuoteId,
        { authToken }
      );
      return ok({ callback, body: { writQuote } });
    },
  },
  {
    id: "updateWritQuote",
    path: new RegExp("^writ-quotes/([^/]+)$"),
    method: httpMethods.PUT,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          authToken,
          body: { writQuote: updateWritQuote },
        },
      }
    ) => {
      const writQuote = await prefixErrorPath(
        appProvider.writQuotesService.updateWritQuote({
          authToken,
          writQuote: updateWritQuote,
        }),
        "writQuote"
      );
      return ok({ callback, body: { writQuote } });
    },
  },

  /*
   * Writs
   */
  {
    id: "readWrits",
    path: "writs",
    method: httpMethods.GET,
    handler: async (appProvider, { request, callback }) => {
      const {
        sorts: encodedSorts,
        continuationToken,
        count,
      } = request.queryStringParameters;
      const sorts = decodeSorts(encodedSorts);
      const { writs, continuationToken: newContinuationToken } =
        await appProvider.writsService.readWrits({
          sorts,
          continuationToken,
          count: toNumber(count),
        });
      return ok({
        callback,
        body: { writs, continuationToken: newContinuationToken },
      });
    },
  },

  /*
   * Auth
   */
  {
    id: "login",
    path: "login",
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          body: { credentials },
        },
      }
    ) => {
      try {
        const { user, authToken, expires } =
          await appProvider.authService.login(credentials);
        return ok({ callback, body: { user, authToken, expires } });
      } catch (err) {
        if (err instanceof EntityNotFoundError) {
          // Hide EntityNotFoundError to prevent someone from learning that an email does or does not correspond to an account
          throw new InvalidLoginError();
        }
      }
    },
  },
  {
    id: "logout",
    path: "logout",
    method: httpMethods.POST,
    handler: async (appProvider, { callback, request: { authToken } }) => {
      await appProvider.authService.logout(authToken);
      return ok({ callback });
    },
  },
  {
    id: "requestPasswordReset",
    path: "password-reset-requests",
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          body: { passwordResetRequest },
        },
      }
    ) => {
      const duration = await appProvider.passwordResetService.createRequest(
        passwordResetRequest
      );
      return ok({ callback, body: { duration } });
    },
  },
  {
    id: "readPasswordReset",
    path: "password-reset-requests",
    method: httpMethods.GET,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          queryStringParameters: { passwordResetCode },
        },
      }
    ) => {
      const email = await appProvider.passwordResetService.checkRequestForCode(
        passwordResetCode
      );
      return ok({ callback, body: { email } });
    },
  },
  {
    id: "completePasswordReset",
    path: "password-resets",
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          body: { passwordResetCode, passwordResetConfirmation },
        },
      }
    ) => {
      const { user, authToken, expires } =
        await appProvider.passwordResetService.resetPasswordAndLogin(
          passwordResetCode,
          passwordResetConfirmation
        );
      return ok({ callback, body: { user, authToken, expires } });
    },
  },
  {
    id: "requestRegistration",
    path: "registration-requests",
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          body: { registrationRequest },
        },
      }
    ) => {
      const duration = await prefixErrorPath(
        appProvider.registrationService.createRequest(registrationRequest),
        "registrationRequest"
      );
      return ok({ callback, body: { duration } });
    },
  },
  {
    id: "readRegistrationRequest",
    path: "registration-requests",
    method: httpMethods.GET,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          queryStringParameters: { registrationCode },
        },
      }
    ) => {
      const email = await appProvider.registrationService.checkRequestForCode(
        registrationCode
      );
      return ok({ callback, body: { email } });
    },
  },
  {
    id: "register",
    path: "registrations",
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          body: { registrationConfirmation },
        },
      }
    ) => {
      const { user, authToken, expires } = await prefixErrorPath(
        appProvider.registrationService.confirmRegistrationAndLogin(
          registrationConfirmation
        ),
        "registrationConfirmation"
      );

      return ok({ callback, body: { user, authToken, expires } });
    },
  },

  /*
   * Votes
   */
  {
    id: "createJustificationVote",
    path: new RegExp("^justification-votes$"),
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          body: { justificationVote: createJustificationVote },
          authToken,
        },
      }
    ) => {
      const justificationVote =
        await appProvider.justificationVotesService.createVote(
          authToken,
          createJustificationVote
        );

      return ok({ callback, body: { justificationVote } });
    },
  },
  {
    id: "deleteJustificationVote",
    path: new RegExp("^justification-votes$"),
    method: httpMethods.DELETE,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          body: { justificationVote },
          authToken,
        },
      }
    ) => {
      await appProvider.justificationVotesService.deleteVote(
        authToken,
        justificationVote
      );
      return ok({ callback });
    },
  },

  {
    id: "createPropositionTagVote",
    path: "proposition-tag-votes",
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          body: { propositionTagVote: createPropositionTagVote },
          authToken,
        },
      }
    ) => {
      const propositionTagVote =
        await appProvider.propositionTagVotesService.readOrCreatePropositionTagVote(
          authToken,
          createPropositionTagVote
        );
      return ok({ callback, body: { propositionTagVote } });
    },
  },
  {
    id: "deletePropositionTagVote",
    path: new RegExp("^proposition-tag-votes/([^/]+)$"),
    method: httpMethods.DELETE,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          pathParameters: [propositionTagVoteId],
          authToken,
        },
      }
    ) => {
      await appProvider.propositionTagVotesService.deletePropositionTagVoteForId(
        authToken,
        propositionTagVoteId
      );
      return ok({ callback });
    },
  },

  /*
   * Users
   */
  {
    id: "createUser",
    path: "users",
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          body: { authToken, user: createUser },
        },
      }
    ) => {
      const user = await appProvider.usersService.createUserAsAuthToken(
        authToken,
        createUser
      );
      return ok({ callback, body: { user } });
    },
  },

  /*
   * Account settings
   */
  {
    id: "createAccountSettings",
    path: "account-settings",
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          authToken,
          body: { accountSettings: createAccountSettings },
        },
      }
    ) => {
      const accountSettings =
        await appProvider.accountSettingsService.createAccountSettings(
          authToken,
          createAccountSettings
        );
      return ok({ callback, body: { accountSettings } });
    },
  },
  {
    id: "readAccountSettings",
    path: "account-settings",
    method: httpMethods.GET,
    handler: async (appProvider, { callback, request: { authToken } }) => {
      try {
        const accountSettings =
          await appProvider.accountSettingsService.readOrCreateAccountSettings(
            authToken
          );

        return ok({ callback, body: { accountSettings } });
      } catch (err) {
        // TODO do we still want this pattern?
        if (err instanceof RequestValidationError) {
          return badRequest({ callback, body: { message: err.message } });
        }
      }
    },
  },
  {
    id: "updateAccountSettings",
    path: "account-settings",
    method: httpMethods.PUT,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          authToken,
          body: { accountSettings: updateAccountSettings },
        },
      }
    ) => {
      const accountSettings = await appProvider.accountSettingsService.update(
        updateAccountSettings,
        authToken
      );
      return ok({ callback, body: { accountSettings } });
    },
  },

  /*
   * Content reports
   */
  {
    id: "createContentReport",
    path: "content-reports",
    method: httpMethods.POST,
    handler: async (
      appProvider,
      {
        callback,
        request: {
          authToken,
          body: { contentReport },
        },
      }
    ) => {
      await appProvider.contentReportsService.createContentReport(
        authToken,
        contentReport
      );
      return ok({ callback });
    },
  },
];

export const selectRoute = (appProvider: AppProvider, request: Request) => {
  const { path, method, queryStringParameters } = request;

  for (const route of routes) {
    let pathMatch;

    if (route.method && route.method !== method) continue;
    if (typeof route.path === "string" && route.path !== path) continue;
    if (route.path instanceof RegExp && !(pathMatch = route.path.exec(path)))
      continue;
    if (route.queryStringParameters) {
      if (
        isEmpty(route.queryStringParameters) !== isEmpty(queryStringParameters)
      ) {
        continue;
      }

      let isMisMatch = false;
      forEach(route.queryStringParameters, (value, name) => {
        const requestValue = queryStringParameters[name] || "";
        if (value instanceof RegExp) {
          // The regex methods cast undefined to the string 'undefined', matching some regexes you might not expect...
          if (isUndefined(requestValue) || !value.test(requestValue)) {
            isMisMatch = true;
          }
        } else if (value !== requestValue) {
          isMisMatch = true;
        }
      });
      if (isMisMatch) {
        continue;
      }
    }

    // First item is the whole match, rest are the group matches
    const pathParameters = pathMatch ? pathMatch.slice(1) : undefined;
    const routedRequest = assign({}, request, { pathParameters });
    appProvider.logger.debug(`selected route ${route.id}`);
    return { route, routedRequest };
  }

  throw new NoMatchingRouteError();
};

const handleRequest = (
  appProvider: AppProvider,
  callback: Callback,
  { route, routedRequest }: { route: Route; routedRequest: Request }
) => route.handler(appProvider, { callback, request: routedRequest });

export const routeRequest = async (
  request: Request,
  appProvider: AppProvider,
  callback: Callback
) => {
  const { route, routedRequest } = selectRoute(appProvider, request);
  try {
    await handleRequest(appProvider, callback, { route, routedRequest });
  } catch (err) {
    if (err instanceof EntityValidationError) {
      badRequest({
        callback,
        body: {
          errorCode: apiErrorCodes.VALIDATION_ERROR,
          errors: err.errors,
        },
      });
    } else if (err instanceof RequestValidationError) {
      badRequest({ callback, body: { message: err.message } });
    } else if (err instanceof EntityNotFoundError) {
      notFound({
        callback,
        body: {
          errorCode: apiErrorCodes.ENTITY_NOT_FOUND,
          entityType: err.entityType,
          identifier: err.identifier,
        },
      });
    } else if (err instanceof NoMatchingRouteError) {
      notFound({
        callback,
        body: { errorCode: apiErrorCodes.ROUTE_NOT_FOUND },
      });
    } else if (err instanceof AuthenticationError) {
      unauthenticated({ callback });
    } else if (err instanceof InvalidLoginError) {
      badRequest({
        callback,
        body: {
          errorCode: apiErrorCodes.INVALID_LOGIN_CREDENTIALS,
        },
      });
    } else if (err instanceof AuthorizationError) {
      unauthorized({
        callback,
        body: {
          errorCode: apiErrorCodes.AUTHORIZATION_ERROR,
          errors: err.errors,
        },
      });
    } else if (err instanceof UserIsInactiveError) {
      error({
        callback,
        body: {
          errorCode: apiErrorCodes.USER_IS_INACTIVE_ERROR,
        },
      });
    } else if (err instanceof EntityConflictError) {
      conflict({
        callback,
        body: {
          errorCode: apiErrorCodes.ENTITY_CONFLICT,
          errors: err.errors,
        },
      });
    } else if (err instanceof UserActionsConflictError) {
      error({
        callback,
        body: {
          errorCode: apiErrorCodes.USER_ACTIONS_CONFLICT,
          errors: err.errors,
        },
      });
    } else if (err instanceof RegistrationExpiredError) {
      notFound({
        callback,
        body: {
          errorCode: apiErrorCodes.EXPIRED,
        },
      });
    } else if (err instanceof RegistrationAlreadyConsumedError) {
      notFound({
        callback,
        body: {
          errorCode: apiErrorCodes.CONSUMED,
        },
      });
    } else if (err instanceof Error) {
      appProvider.logger.error("Unexpected error", { err, stack: err.stack });
      return error({
        callback,
        body: { errorCode: apiErrorCodes.UNEXPECTED_ERROR },
      });
    } else {
      appProvider.logger.error("Caught unexpected non-error:", toJson(err));
      return error({
        callback,
        body: { errorCode: apiErrorCodes.UNEXPECTED_ERROR },
      });
    }
  }
};
