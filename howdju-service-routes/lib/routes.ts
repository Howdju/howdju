import { toNumber, split } from "lodash";

import {
  decodeQueryStringObject,
  decodeSorts,
  httpMethods,
  JustificationRootTargetTypes,
  Proposition,
  WritQuote,
  JustificationSearchFilters,
  AuthToken,
  CreateProposition,
  UpdateProposition,
  CreateStatement,
  CreateJustification,
  CreateWritQuote,
  UpdateWritQuote,
  Credentials,
  PasswordResetRequest,
  RegistrationConfirmation,
  RegistrationRequest,
  CreatePropositionTagVote,
  CreateUser,
  CreateAccountSettings,
  UpdateAccountSettings,
  CreateContentReport,
  UpdatePersorg,
  CreateJustificationVote,
  DeleteJustificationVote,
} from "howdju-common";
import {
  EntityNotFoundError,
  InvalidLoginError,
  prefixErrorPath,
  ServicesProvider,
} from "howdju-service-common";

type QueryStringParameters<Params extends string> = {
  queryStringParameters: {
    [key in Params]: string | undefined;
  };
};

type PathParameters = {
  pathParameters: string[];
};

type Authed = {
  authToken: AuthToken;
};

type Body<T> = {
  body: T;
};

export type ServiceRoute = typeof serviceRoutes[keyof typeof serviceRoutes];

export const serviceRoutes = {
  /*
   * Options
   */
  options: {
    method: httpMethods.OPTIONS,
    handler: (_appProvider: ServicesProvider) => Promise.resolve(),
  },
  /*
   * Search
   */
  searchPropositions: {
    path: "search-propositions",
    method: httpMethods.GET,
    handler: async (
      appProvider: ServicesProvider,
      {
        queryStringParameters: { searchText },
      }: QueryStringParameters<"searchText">
    ) => {
      const rankedPropositions =
        await appProvider.propositionsTextSearcher.search(searchText);
      return { body: rankedPropositions };
    },
  },
  searchTags: {
    path: "search-tags",
    method: httpMethods.GET,
    handler: async (
      appProvider: ServicesProvider,
      {
        queryStringParameters: { searchText },
      }: QueryStringParameters<"searchText">
    ) => {
      const rankedPropositions =
        await appProvider.tagsService.readTagsLikeTagName(searchText);
      return { body: rankedPropositions };
    },
  },
  searchWrits: {
    path: "search-writs",
    method: httpMethods.GET,
    handler: async (
      appProvider: ServicesProvider,
      {
        queryStringParameters: { searchText },
      }: QueryStringParameters<"searchText">
    ) => {
      const rankedWrits = await appProvider.writsTitleSearcher.search(
        searchText
      );
      return { body: rankedWrits };
    },
  },
  searchPersorgs: {
    path: "search-persorgs",
    method: httpMethods.GET,
    async handler(
      appProvider: ServicesProvider,
      {
        queryStringParameters: { searchText },
      }: QueryStringParameters<"searchText">
    ) {
      const rankedPersorgs = await appProvider.persorgsNameSearcher.search(
        searchText
      );
      return { body: rankedPersorgs };
    },
  },
  mainSearch: {
    path: "search",
    method: httpMethods.GET,
    handler: async (
      appProvider: ServicesProvider,
      {
        queryStringParameters: { searchText },
      }: QueryStringParameters<"searchText">
    ) => {
      const results = await appProvider.mainSearchService.search(searchText);
      return { body: results };
    },
  },
  readTag: {
    path: new RegExp("^tags/([^/]+)$"),
    method: httpMethods.GET,
    handler: async (
      appProvider: ServicesProvider,
      { pathParameters: [tagId] }: PathParameters
    ) => {
      const tag = await appProvider.tagsService.readTagForId(tagId);
      return { body: { tag } };
    },
  },
  /*
   * Propositions
   */
  readTaggedPropositions: {
    path: "propositions",
    method: httpMethods.GET,
    queryStringParameters: { tagId: /.+/ },
    handler: async (
      appProvider: ServicesProvider,
      {
        queryStringParameters: { tagId },
        authToken,
      }: QueryStringParameters<"tagId"> & Authed
    ) => {
      const propositions =
        await appProvider.propositionsService.readPropositionsForTagId(tagId, {
          authToken,
        });
      return { body: { propositions } };
    },
  },
  readPropositions: {
    path: "propositions",
    method: httpMethods.GET,
    handler: async (
      appProvider: ServicesProvider,
      {
        queryStringParameters: {
          sorts: encodedSorts,
          continuationToken,
          count,
          propositionIds: propositionIdsParam,
        },
      }: QueryStringParameters<
        "sorts" | "continuationToken" | "count" | "propositionIds"
      >
    ) => {
      const sorts = decodeSorts(encodedSorts);
      if (propositionIdsParam) {
        const propositionIds = split(propositionIdsParam, ",");
        const propositions =
          await appProvider.propositionsService.readPropositionsForIds(
            propositionIds
          );
        return { body: { propositions } };
      } else {
        const { propositions, continuationToken: newContinuationToken } =
          await appProvider.propositionsService.readPropositions({
            sorts,
            continuationToken: continuationToken as any,
            count: count as any,
          });
        return {
          body: { propositions, continuationToken: newContinuationToken },
        };
      }
    },
  },
  createProposition: {
    path: "propositions",
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      {
        authToken,
        body: { proposition: createProposition },
      }: Authed & Body<{ proposition: CreateProposition }>
    ) => {
      const { proposition, isExtant } = await prefixErrorPath(
        appProvider.propositionsService.readOrCreateProposition(
          authToken,
          createProposition
        ) as Promise<{ isExtant: boolean; proposition: Proposition }>,
        "proposition"
      );
      return { body: { proposition, isExtant } };
    },
  },
  readProposition: {
    path: new RegExp("^propositions/([^/]+)$"),
    method: httpMethods.GET,
    // explicitly no query string parameters
    queryStringParameters: {},
    handler: async (
      appProvider: ServicesProvider,
      { pathParameters: [propositionId], authToken }: Authed & PathParameters
    ) => {
      const proposition =
        await appProvider.propositionsService.readPropositionForId(
          propositionId,
          { authToken, userId: undefined }
        );
      return { body: { proposition } };
    },
  },
  updateProposition: {
    path: new RegExp("^propositions/([^/]+)$"),
    method: httpMethods.PUT,
    handler: async (
      appProvider: ServicesProvider,
      {
        authToken,
        body: { proposition: updateProposition },
      }: Authed & Body<{ proposition: UpdateProposition }>
    ) => {
      const proposition = await prefixErrorPath(
        appProvider.propositionsService.updateProposition(
          authToken,
          updateProposition
        ),
        "proposition"
      );
      return { body: { proposition } };
    },
  },
  deleteProposition: {
    path: new RegExp("^propositions/([^/]+)$"),
    method: httpMethods.DELETE,
    handler: async (
      appProvider: ServicesProvider,
      { authToken, pathParameters: [propositionId] }: Authed & PathParameters
    ) => {
      await prefixErrorPath(
        appProvider.propositionsService.deleteProposition(
          authToken,
          propositionId
        ),
        "proposition"
      );
    },
  },
  /*
   * Statements
   */
  createStatement: {
    path: new RegExp("^statements$"),
    method: httpMethods.POST,
    async handler(
      appProvider: ServicesProvider,
      {
        authToken,
        body: { statement: inStatement },
      }: Authed & Body<{ statement: CreateStatement }>
    ) {
      const { isExtant, statement } =
        await appProvider.statementsService.readOrCreate(
          inStatement,
          authToken
        );
      return { body: { isExtant, statement } };
    },
  },
  readSpeakerStatements: {
    path: "statements",
    method: httpMethods.GET,
    queryStringParameters: { speakerPersorgId: /.+/ },
    async handler(
      appProvider: ServicesProvider,
      {
        queryStringParameters: { speakerPersorgId },
      }: QueryStringParameters<"speakerPersorgId">
    ) {
      const statements =
        await appProvider.statementsService.readStatementsForSpeakerPersorgId(
          speakerPersorgId
        );
      return { body: { statements } };
    },
  },
  readSentenceStatements: {
    path: "statements",
    method: httpMethods.GET,
    queryStringParameters: {
      sentenceType: /.+/,
      sentenceId: /.+/,
    },
    async handler(
      appProvider: ServicesProvider,
      {
        queryStringParameters: { sentenceType, sentenceId },
      }: QueryStringParameters<"sentenceType" | "sentenceId">
    ) {
      const statements =
        await appProvider.statementsService.readStatementsForSentenceTypeAndId(
          sentenceType,
          sentenceId
        );
      return { body: { statements } };
    },
  },
  readIndirectRootPropositionStatements: {
    path: "statements",
    method: httpMethods.GET,
    queryStringParameters: {
      rootPropositionId: /.+/,
      indirect: "",
    },
    async handler(
      appProvider: ServicesProvider,
      {
        queryStringParameters: { rootPropositionId },
      }: QueryStringParameters<"rootPropositionId">
    ) {
      const statements =
        await appProvider.statementsService.readIndirectStatementsForRootPropositionId(
          rootPropositionId
        );
      return { body: { statements } };
    },
  },
  readRootPropositionStatements: {
    path: "statements",
    method: httpMethods.GET,
    queryStringParameters: {
      rootPropositionId: /.+/,
    },
    async handler(
      appProvider: ServicesProvider,
      {
        queryStringParameters: { rootPropositionId },
      }: QueryStringParameters<"rootPropositionId">
    ) {
      const statements =
        await appProvider.statementsService.readStatementsForRootPropositionId(
          rootPropositionId
        );
      return { body: { statements } };
    },
  },
  readStatement: {
    path: new RegExp("^statements/([^/]+)$"),
    method: httpMethods.GET,
    // explicitly no query string parameters
    queryStringParameters: {},
    async handler(
      appProvider: ServicesProvider,
      { pathParameters: [statementId] }: PathParameters
    ) {
      const { statement } =
        await appProvider.statementsService.readStatementForId(statementId);
      return { body: { statement } };
    },
  },
  /*
   * Persorgs
   */
  readPersorg: {
    path: new RegExp("^persorgs/([^/]+)$"),
    method: httpMethods.GET,
    async handler(
      appProvider: ServicesProvider,
      { pathParameters: [persorgId] }: PathParameters
    ) {
      const persorg = await appProvider.persorgsService.readPersorgForId(
        persorgId
      );
      return { body: { persorg } };
    },
  },
  updatePersorg: {
    path: new RegExp("^persorgs/([^/]+)$"),
    method: httpMethods.PUT,
    handler: async (
      appProvider: ServicesProvider,
      {
        authToken,
        body: { persorg: updatePersorg },
      }: Authed & Body<{ persorg: UpdatePersorg }>
    ) => {
      const persorg = await prefixErrorPath(
        appProvider.persorgsService.update(updatePersorg, authToken),
        "persorg"
      );
      return { body: { persorg } };
    },
  },
  /*
   * Root target justifications
   */
  readPropositionJustifications: {
    path: new RegExp("^propositions/([^/]+)$"),
    method: httpMethods.GET,
    queryStringParameters: {
      include: "justifications",
    },
    handler: async (
      appProvider: ServicesProvider,
      { pathParameters: [propositionId], authToken }: PathParameters & Authed
    ) => {
      const proposition =
        await appProvider.rootTargetJustificationsService.readRootTargetWithJustifications(
          JustificationRootTargetTypes.PROPOSITION,
          propositionId,
          authToken
        );
      return { body: { proposition } };
    },
  },
  readStatementJustifications: {
    path: new RegExp("^statements/([^/]+)$"),
    method: httpMethods.GET,
    queryStringParameters: {
      include: "justifications",
    },
    handler: async (
      appProvider: ServicesProvider,
      { pathParameters: [statementId], authToken }: PathParameters & Authed
    ) => {
      const statement =
        await appProvider.rootTargetJustificationsService.readRootTargetWithJustifications(
          JustificationRootTargetTypes.STATEMENT,
          statementId,
          authToken
        );
      return { body: { statement } };
    },
  },
  /*
   * Proposition compounds
   */
  readPropositionCompound: {
    path: new RegExp("^proposition-compounds/([^/]+)$"),
    method: httpMethods.GET,
    queryStringParameters: {},
    handler: async (
      appProvider: ServicesProvider,
      {
        pathParameters: [propositionCompoundId],
        authToken,
      }: PathParameters & Authed
    ) => {
      const propositionCompound =
        await appProvider.propositionCompoundsService.readPropositionCompoundForId(
          propositionCompoundId,
          { authToken }
        );
      return { body: { propositionCompound } };
    },
  },
  /*
   * Source excerpt paraphrases
   */
  readSourceExcerptParaphrase: {
    path: new RegExp("^source-excerpt-paraphrases/([^/]+)$"),
    method: httpMethods.GET,
    queryStringParameters: {},
    handler: async (
      appProvider: ServicesProvider,
      {
        pathParameters: [sourceExcerptParaphraseId],
        authToken,
      }: PathParameters & Authed
    ) => {
      const sourceExcerptParaphrase =
        await appProvider.sourceExcerptParaphrasesService.readSourceExcerptParaphraseForId(
          sourceExcerptParaphraseId,
          {
            authToken,
          }
        );
      return { body: { sourceExcerptParaphrase } };
    },
  },
  /*
   * Justifications
   */
  createJustification: {
    path: "justifications",
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      {
        authToken,
        body: { justification: createJustification },
      }: Authed & Body<{ justification: CreateJustification }>
    ) => {
      const { justification, isExtant } = await prefixErrorPath(
        appProvider.justificationsService.readOrCreate(
          createJustification,
          authToken
        ),
        "justification"
      );
      return { body: { justification, isExtant } };
    },
  },
  readJustifications: {
    path: "justifications",
    method: httpMethods.GET,
    handler: async (
      appProvider: ServicesProvider,
      {
        queryStringParameters: {
          filters: encodedFilters,
          sorts: encodedSorts,
          continuationToken,
          count,
          includeUrls,
        },
      }: QueryStringParameters<
        "filters" | "sorts" | "continuationToken" | "count" | "includeUrls"
      >
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
    },
  },
  deleteJustification: {
    path: new RegExp("^justifications/([^/]+)$"),
    method: httpMethods.DELETE,
    handler: async (
      appProvider: ServicesProvider,
      { authToken, pathParameters: [justificationId] }: PathParameters & Authed
    ) => {
      await prefixErrorPath(
        appProvider.justificationsService.deleteJustification(
          authToken,
          justificationId
        ),
        "justification"
      );
    },
  },
  /*
   * Writ quotes
   */
  createWritQuote: {
    path: "writ-quotes",
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      {
        authToken,
        body: { writQuote: createWritQuote },
      }: Authed & Body<{ writQuote: CreateWritQuote }>
    ) => {
      const { writQuote, alreadyExists } = await prefixErrorPath(
        appProvider.writQuotesService.createWritQuote({
          authToken,
          writQuote: createWritQuote,
        }) as Promise<{ alreadyExists: boolean; writQuote: WritQuote }>,
        "writQuote"
      );
      return { body: { writQuote, alreadyExists } };
    },
  },
  readWritQuotes: {
    path: "writ-quotes",
    method: httpMethods.GET,
    handler: async (
      appProvider: ServicesProvider,
      {
        queryStringParameters: {
          sorts: encodedSorts,
          continuationToken,
          count,
        },
      }: QueryStringParameters<"sorts" | "continuationToken" | "count">
    ) => {
      const sorts = decodeSorts(encodedSorts);
      const { writQuotes, continuationToken: newContinuationToken } =
        await appProvider.writQuotesService.readWritQuotes({
          sorts,
          continuationToken,
          count: toNumber(count),
        });
      return {
        body: { writQuotes, continuationToken: newContinuationToken },
      };
    },
  },
  readWritQuote: {
    path: new RegExp("^writ-quotes/([^/]+)$"),
    method: httpMethods.GET,
    handler: async (
      appProvider: ServicesProvider,
      { pathParameters: [writQuoteId], authToken }: PathParameters & Authed
    ) => {
      const writQuote = await appProvider.writQuotesService.readWritQuoteForId(
        writQuoteId,
        { authToken }
      );
      return { body: { writQuote } };
    },
  },
  updateWritQuote: {
    path: new RegExp("^writ-quotes/([^/]+)$"),
    method: httpMethods.PUT,
    handler: async (
      appProvider: ServicesProvider,
      {
        authToken,
        body: { writQuote: updateWritQuote },
      }: Authed & Body<{ writQuote: UpdateWritQuote }>
    ) => {
      const writQuote = await prefixErrorPath(
        appProvider.writQuotesService.updateWritQuote({
          authToken,
          writQuote: updateWritQuote,
        }),
        "writQuote"
      );
      return { body: { writQuote } };
    },
  },
  /*
   * Writs
   */
  readWrits: {
    path: "writs",
    method: httpMethods.GET,
    handler: async (
      appProvider: ServicesProvider,
      {
        queryStringParameters: {
          sorts: encodedSorts,
          continuationToken,
          count,
        },
      }: QueryStringParameters<"sorts" | "continuationToken" | "count">
    ) => {
      const sorts = decodeSorts(encodedSorts);
      const { writs, continuationToken: newContinuationToken } =
        await appProvider.writsService.readWrits({
          sorts,
          continuationToken,
          count: toNumber(count),
        });
      return {
        body: { writs, continuationToken: newContinuationToken },
      };
    },
  },
  /*
   * Auth
   */
  login: {
    path: "login",
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      { body: { credentials } }: Body<{ credentials: Credentials }>
    ) => {
      try {
        const { user, authToken, expires } =
          await appProvider.authService.login(credentials);
        return { body: { user, authToken, expires } };
      } catch (err) {
        if (err instanceof EntityNotFoundError) {
          // Hide EntityNotFoundError to prevent someone from learning that an email does or does not correspond to an account
          throw new InvalidLoginError();
        }
        throw err;
      }
    },
  },
  logout: {
    path: "logout",
    method: httpMethods.POST,
    handler: async (appProvider: ServicesProvider, { authToken }: Authed) => {
      await appProvider.authService.logout(authToken);
    },
  },
  requestPasswordReset: {
    path: "password-reset-requests",
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      {
        body: { passwordResetRequest },
      }: Body<{ passwordResetRequest: PasswordResetRequest }>
    ) => {
      const duration = await appProvider.passwordResetService.createRequest(
        passwordResetRequest
      );
      return { body: { duration } };
    },
  },
  readPasswordReset: {
    path: "password-reset-requests",
    method: httpMethods.GET,
    handler: async (
      appProvider: ServicesProvider,
      {
        queryStringParameters: { passwordResetCode },
      }: QueryStringParameters<"passwordResetCode">
    ) => {
      const email = await appProvider.passwordResetService.checkRequestForCode(
        passwordResetCode
      );
      return { body: { email } };
    },
  },
  completePasswordReset: {
    path: "password-resets",
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      {
        body: { passwordResetCode, passwordResetConfirmation },
      }: Body<{ passwordResetCode: string; passwordResetConfirmation: string }>
    ) => {
      const { user, authToken, expires } =
        await appProvider.passwordResetService.resetPasswordAndLogin(
          passwordResetCode,
          passwordResetConfirmation
        );
      return { body: { user, authToken, expires } };
    },
  },
  requestRegistration: {
    path: "registration-requests",
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      {
        body: { registrationRequest },
      }: Body<{ registrationRequest: RegistrationRequest }>
    ) => {
      const duration = await prefixErrorPath(
        appProvider.registrationService.createRequest(registrationRequest),
        "registrationRequest"
      );
      return { body: { duration } };
    },
  },
  readRegistrationRequest: {
    path: "registration-requests",
    method: httpMethods.GET,
    handler: async (
      appProvider: ServicesProvider,
      {
        queryStringParameters: { registrationCode },
      }: QueryStringParameters<"registrationCode">
    ) => {
      const email = await appProvider.registrationService.checkRequestForCode(
        registrationCode
      );
      return { body: { email } };
    },
  },
  register: {
    path: "registrations",
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      {
        body: { registrationConfirmation },
      }: Body<{ registrationConfirmation: RegistrationConfirmation }>
    ) => {
      const { user, authToken, expires } = await prefixErrorPath(
        appProvider.registrationService.confirmRegistrationAndLogin(
          registrationConfirmation
        ),
        "registrationConfirmation"
      );

      return { body: { user, authToken, expires } };
    },
  },
  /*
   * Votes
   */
  createJustificationVote: {
    path: new RegExp("^justification-votes$"),
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      {
        body: { justificationVote: createJustificationVote },
        authToken,
      }: Authed & Body<{ justificationVote: CreateJustificationVote }>
    ) => {
      const justificationVote =
        await appProvider.justificationVotesService.createVote(
          authToken,
          createJustificationVote
        );

      return { body: { justificationVote } };
    },
  },
  deleteJustificationVote: {
    path: new RegExp("^justification-votes$"),
    method: httpMethods.DELETE,
    handler: async (
      appProvider: ServicesProvider,
      {
        body: { justificationVote },
        authToken,
      }: Authed & Body<{ justificationVote: DeleteJustificationVote }>
    ) => {
      await appProvider.justificationVotesService.deleteVote(
        authToken,
        justificationVote
      );
    },
  },
  createPropositionTagVote: {
    path: "proposition-tag-votes",
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      {
        body: { propositionTagVote: createPropositionTagVote },
        authToken,
      }: Authed & Body<{ propositionTagVote: CreatePropositionTagVote }>
    ) => {
      const propositionTagVote =
        await appProvider.propositionTagVotesService.readOrCreatePropositionTagVote(
          authToken,
          createPropositionTagVote
        );
      return { body: { propositionTagVote } };
    },
  },
  deletePropositionTagVote: {
    path: new RegExp("^proposition-tag-votes/([^/]+)$"),
    method: httpMethods.DELETE,
    handler: async (
      appProvider: ServicesProvider,
      {
        pathParameters: [propositionTagVoteId],
        authToken,
      }: PathParameters & Authed
    ) => {
      await appProvider.propositionTagVotesService.deletePropositionTagVoteForId(
        authToken,
        propositionTagVoteId
      );
    },
  },
  /*
   * Users
   */
  createUser: {
    path: "users",
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      {
        authToken,
        body: { user: createUser },
      }: Authed & Body<{ user: CreateUser }>
    ) => {
      const user = await appProvider.usersService.createUserAsAuthToken(
        authToken,
        createUser
      );
      return { body: { user } };
    },
  },
  /*
   * Account settings
   */
  createAccountSettings: {
    path: "account-settings",
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      {
        authToken,
        body: { accountSettings: createAccountSettings },
      }: Authed & Body<{ accountSettings: CreateAccountSettings }>
    ) => {
      const accountSettings =
        await appProvider.accountSettingsService.createAccountSettings(
          authToken,
          createAccountSettings
        );
      return { body: { accountSettings } };
    },
  },
  readAccountSettings: {
    path: "account-settings",
    method: httpMethods.GET,
    handler: async (appProvider: ServicesProvider, { authToken }: Authed) => {
      const accountSettings =
        await appProvider.accountSettingsService.readOrCreateAccountSettings(
          authToken
        );

      return { body: { accountSettings } };
    },
  },
  updateAccountSettings: {
    path: "account-settings",
    method: httpMethods.PUT,
    handler: async (
      appProvider: ServicesProvider,
      {
        authToken,
        body: { accountSettings: updateAccountSettings },
      }: Authed & Body<{ accountSettings: UpdateAccountSettings }>
    ) => {
      const accountSettings = await appProvider.accountSettingsService.update(
        updateAccountSettings,
        authToken
      );
      return { body: { accountSettings } };
    },
  },
  /*
   * Content reports
   */
  createContentReport: {
    path: "content-reports",
    method: httpMethods.POST,
    handler: async (
      appProvider: ServicesProvider,
      {
        authToken,
        body: { contentReport },
      }: Authed & Body<{ contentReport: CreateContentReport }>
    ) => {
      await appProvider.contentReportsService.createContentReport(
        authToken,
        contentReport
      );
    },
  },
} as const;
