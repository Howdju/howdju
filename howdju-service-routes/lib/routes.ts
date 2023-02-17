import { toNumber, split, reduce } from "lodash";
import { z } from "zod";

import {
  decodeQueryStringObject,
  decodeSorts,
  httpMethods,
  JustificationRootTargetTypes,
  Proposition,
  WritQuote,
  JustificationSearchFilters,
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
  Password,
} from "howdju-common";
import {
  EntityNotFoundError,
  InvalidLoginError,
  InvalidRequestError,
  prefixErrorPath,
  ServicesProvider,
} from "howdju-service-common";

/** A request schema mixin for routes receiving an auth token. */
const Authed = z.object({
  authToken: z.string(),
});
type Authed = z.infer<typeof Authed>;

/** A request schema mixin for routes receiving path parameters. */
const PathParams = function <U extends string, T extends [U, ...U[]]>(
  ...paramNames: T
) {
  const shape = reduce(
    paramNames,
    (acc, p: T[number]) => {
      acc[p] = z.string();
      return acc;
    },
    {} as { [key in T[number]]: z.ZodString }
  );
  return z.object({ pathParams: z.object(shape) });
};
export type PathParams<T extends Record<string, string>> = {
  pathParams: T;
};

const QueryStringParams = function <U extends string, T extends [U, ...U[]]>(
  ...paramNames: T
) {
  const shape = reduce(
    paramNames,
    (acc, p: T[number]) => {
      acc[p] = z.string().optional();
      return acc;
    },
    {} as { [key in T[number]]: z.ZodOptional<z.ZodString> }
  );
  return z.object({ queryStringParams: z.object(shape) });
};
export type QueryStringParams<T extends Record<string, string>> = {
  queryStringParams: T;
};

/** A request schema mixin for routes receiving request bodies. */
const Body = function <T extends z.ZodRawShape>(bodyShape: T) {
  return z.object({ body: z.object(bodyShape) });
};

export type Body<T> = {
  body: T;
};

/** Matches any request. */
const Any = z.object({});

export type ServiceRoutes = typeof serviceRoutes;
export type ServiceRoute = ServiceRoutes[keyof ServiceRoutes];
export type PathedServiceRoute = ServiceRoute & { path: string };

type InferRequest<Schema> = Schema extends z.ZodType<infer T, z.ZodTypeDef>
  ? T
  : never;

/**
 * Creates a service request handler that validates the request and delegates to an impl.
 *
 * This helper also helps with type inference from the validation schema to the impl.
 *
 * @param schema The request validation schema
 * @param impl The request handler implementation
 * @typeparam T the request's type
 * @typeparam R the response's type.
 * @returns A promise of the response
 */
function handler<S extends z.ZodType<T, z.ZodTypeDef>, R, T = InferRequest<S>>(
  schema: S,
  impl: (provider: ServicesProvider, request: T) => Promise<R>
) {
  return {
    schema,
    handler: async function handleRequest(
      provider: ServicesProvider,
      request: T
    ) {
      return await impl(provider, schema.parse(request));
    },
  };
}

export const serviceRoutes = {
  /*
   * Options
   */
  options: {
    method: httpMethods.OPTIONS,
    request: handler(Any, async (_appProvider: ServicesProvider, _request) =>
      Promise.resolve()
    ),
  },
  /*
   * Search
   */
  searchPropositions: {
    path: "search-propositions",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("searchText"),
      async (
        appProvider: ServicesProvider,
        { queryStringParams: { searchText } }
      ) => {
        const rankedPropositions =
          await appProvider.propositionsTextSearcher.search(searchText);
        return { body: rankedPropositions };
      }
    ),
  },
  searchTags: {
    path: "search-tags",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("searchText"),
      async (
        appProvider: ServicesProvider,
        { queryStringParams: { searchText } }
      ) => {
        const rankedPropositions =
          await appProvider.tagsService.readTagsLikeTagName(searchText);
        return { body: rankedPropositions };
      }
    ),
  },
  searchWrits: {
    path: "search-writs",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("searchText"),
      async (
        appProvider: ServicesProvider,
        { queryStringParams: { searchText } }
      ) => {
        const rankedWrits = await appProvider.writsTitleSearcher.search(
          searchText
        );
        return { body: rankedWrits };
      }
    ),
  },
  searchPersorgs: {
    path: "search-persorgs",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("searchText"),
      async (
        appProvider: ServicesProvider,
        { queryStringParams: { searchText } }
      ) => {
        const rankedPersorgs = await appProvider.persorgsNameSearcher.search(
          searchText
        );
        return { body: rankedPersorgs };
      }
    ),
  },
  mainSearch: {
    path: "search",
    method: httpMethods.GET,
    request: handler(
      QueryStringParams("searchText"),
      async (
        appProvider: ServicesProvider,
        { queryStringParams: { searchText } }
      ) => {
        const results = await appProvider.mainSearchService.search(searchText);
        return { body: results };
      }
    ),
  },
  readTag: {
    path: "tags/:tagId",
    method: httpMethods.GET,
    request: handler(
      PathParams("tagId"),
      async (appProvider: ServicesProvider, { pathParams: { tagId } }) => {
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
      Authed.merge(QueryStringParams("tagId")),
      async (
        appProvider: ServicesProvider,
        { queryStringParams: { tagId }, authToken }
      ) => {
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
        "sorts",
        "continuationToken",
        "count",
        "propositionIds"
      ),
      async (
        appProvider: ServicesProvider,
        {
          queryStringParams: {
            sorts: encodedSorts,
            continuationToken,
            count,
            propositionIds: propositionIdsParam,
          },
        }
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
      }
    ),
  },
  createProposition: {
    path: "propositions",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(Body({ proposition: CreateProposition })),
      async (
        appProvider: ServicesProvider,
        { authToken, body: { proposition: createProposition } }
      ) => {
        const { proposition, isExtant } = await prefixErrorPath(
          appProvider.propositionsService.readOrCreateProposition(
            authToken,
            createProposition
          ) as Promise<{ isExtant: boolean; proposition: Proposition }>,
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
      PathParams("propositionId").merge(Authed),
      async (
        appProvider: ServicesProvider,
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
        appProvider: ServicesProvider,
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
        appProvider: ServicesProvider,
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
        appProvider: ServicesProvider,
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
    path: "statements",
    method: httpMethods.GET,
    queryStringParams: { speakerPersorgId: /.+/ },
    request: handler(
      QueryStringParams("speakerPersorgId"),
      async (
        appProvider: ServicesProvider,
        { queryStringParams: { speakerPersorgId } }
      ) => {
        const statements =
          await appProvider.statementsService.readStatementsForSpeakerPersorgId(
            speakerPersorgId
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
        appProvider: ServicesProvider,
        { queryStringParams: { sentenceType, sentenceId } }
      ) => {
        const statements =
          await appProvider.statementsService.readStatementsForSentenceTypeAndId(
            sentenceType,
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
        appProvider: ServicesProvider,
        { queryStringParams: { rootPropositionId } }
      ) => {
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
        appProvider: ServicesProvider,
        { queryStringParams: { rootPropositionId } }
      ) => {
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
        appProvider: ServicesProvider,
        { pathParams: { statementId } }
      ) => {
        const { statement } =
          await appProvider.statementsService.readStatementForId(statementId);
        return { body: { statement } };
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
      async (appProvider: ServicesProvider, { pathParams: { persorgId } }) => {
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
        appProvider: ServicesProvider,
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
      Authed.merge(PathParams("propositionId")),
      async (
        appProvider: ServicesProvider,
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
      PathParams("statementId").merge(Authed),
      async (
        appProvider: ServicesProvider,
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
      PathParams("propositionCompoundId").merge(Authed),
      async (
        appProvider: ServicesProvider,
        { pathParams: { propositionCompoundId }, authToken }
      ) => {
        const propositionCompound =
          await appProvider.propositionCompoundsService.readPropositionCompoundForId(
            propositionCompoundId,
            { authToken }
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
      PathParams("sourceExcerptParaphraseId").merge(Authed),
      async (
        appProvider: ServicesProvider,
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
        appProvider: ServicesProvider,
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
        appProvider: ServicesProvider,
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
        appProvider: ServicesProvider,
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
   * Writ quotes
   */
  createWritQuote: {
    path: "writ-quotes",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(Body({ writQuote: CreateWritQuote })),
      async (
        appProvider: ServicesProvider,
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
        appProvider: ServicesProvider,
        { queryStringParams: { sorts: encodedSorts, continuationToken, count } }
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
      }
    ),
  },
  readWritQuote: {
    path: "writ-quotes/:writQuoteId",
    method: httpMethods.GET,
    request: handler(
      PathParams("writQuoteId").merge(Authed),
      async (
        appProvider: ServicesProvider,
        { pathParams: { writQuoteId }, authToken }
      ) => {
        const writQuote =
          await appProvider.writQuotesService.readWritQuoteForId(writQuoteId, {
            authToken,
          });
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
          }) as Promise<WritQuote>,
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
        appProvider: ServicesProvider,
        { queryStringParams: { sorts: encodedSorts, continuationToken, count } }
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
      async (appProvider: ServicesProvider, { body: { credentials } }) => {
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
      }
    ),
  },
  logout: {
    path: "logout",
    method: httpMethods.POST,
    request: handler(
      Authed,
      async (appProvider: ServicesProvider, { authToken }) => {
        await appProvider.authService.logout(authToken);
      }
    ),
  },
  requestPasswordReset: {
    path: "password-reset-requests",
    method: httpMethods.POST,
    request: handler(
      Body({ passwordResetRequest: PasswordResetRequest }),
      async (
        appProvider: ServicesProvider,
        { body: { passwordResetRequest } }
      ) => {
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
        appProvider: ServicesProvider,
        { queryStringParams: { passwordResetCode } }
      ) => {
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
        passwordResetCode: Password,
        passwordResetConfirmation: Password,
      }),
      async (
        appProvider: ServicesProvider,
        { body: { passwordResetCode, passwordResetConfirmation } }
      ) => {
        const { user, authToken, expires } =
          await appProvider.passwordResetService.resetPasswordAndLogin(
            passwordResetCode,
            passwordResetConfirmation
          );
        return { body: { user, authToken, expires } };
      }
    ),
  },
  requestRegistration: {
    path: "registration-requests",
    method: httpMethods.POST,
    request: handler(
      Body({ registrationRequest: RegistrationRequest }),
      async (
        appProvider: ServicesProvider,
        { body: { registrationRequest } }
      ) => {
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
        appProvider: ServicesProvider,
        { queryStringParams: { registrationCode } }
      ) => {
        const email = await appProvider.registrationService.checkRequestForCode(
          registrationCode
        );
        return { body: { email } };
      }
    ),
  },
  register: {
    path: "registrations",
    method: httpMethods.POST,
    request: handler(
      Body({ registrationConfirmation: RegistrationConfirmation }),
      async (
        appProvider: ServicesProvider,
        { body: { registrationConfirmation } }
      ) => {
        const { user, authToken, expires } = await prefixErrorPath(
          appProvider.registrationService.confirmRegistrationAndLogin(
            registrationConfirmation
          ),
          "registrationConfirmation"
        );

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
        appProvider: ServicesProvider,
        { body: { justificationVote: createJustificationVote }, authToken }
      ) => {
        const justificationVote =
          await appProvider.justificationVotesService.createVote(
            authToken,
            createJustificationVote
          );

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
        appProvider: ServicesProvider,
        { body: { justificationVote }, authToken }
      ) => {
        await appProvider.justificationVotesService.deleteVote(
          authToken,
          justificationVote
        );
      }
    ),
  },
  createPropositionTagVote: {
    path: "proposition-tag-votes",
    method: httpMethods.POST,
    request: handler(
      Authed.merge(Body({ propositionTagVote: CreatePropositionTagVote })),
      async (
        appProvider: ServicesProvider,
        { body: { propositionTagVote: createPropositionTagVote }, authToken }
      ) => {
        const propositionTagVote =
          await appProvider.propositionTagVotesService.readOrCreatePropositionTagVote(
            authToken,
            createPropositionTagVote
          );
        return { body: { propositionTagVote } };
      }
    ),
  },
  deletePropositionTagVote: {
    path: "proposition-tag-votes/:propositionTagVoteId",
    method: httpMethods.DELETE,
    request: handler(
      PathParams("propositionTagVoteId").merge(Authed),
      async (
        appProvider: ServicesProvider,
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
        appProvider: ServicesProvider,
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
        appProvider: ServicesProvider,
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
      async (appProvider: ServicesProvider, { authToken }) => {
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
        appProvider: ServicesProvider,
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
      Authed.merge(Body({ contentReport: CreateContentReport })),
      async (
        appProvider: ServicesProvider,
        { authToken, body: { contentReport } }
      ) => {
        await appProvider.contentReportsService.createContentReport(
          authToken,
          contentReport
        );
      }
    ),
  },
} as const;
