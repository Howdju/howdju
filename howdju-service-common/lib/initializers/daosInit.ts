import {
  AccountSettingsDao,
  ActionsDao,
  AuthDao,
  CanonicalUrlsDao,
  ContentReportsDao,
  WritQuotesDao,
  WritsDao,
  JobHistoryDao,
  JustificationScoresDao,
  JustificationsDao,
  JustificationBasisCompoundsDao,
  JustificationVotesDao,
  MediaExcerptsDao,
  PermissionsDao,
  PersorgsDao,
  PerspectivesDao,
  PicRegionsDao,
  SourceExcerptParaphrasesDao,
  PasswordResetRequestsDao,
  PropositionsDao,
  PropositionCompoundsDao,
  PropositionTagsDao,
  PropositionTagVotesDao,
  RegistrationRequestsDao,
  StatementsDao,
  SourcesDao,
  TagsDao,
  UserExternalIdsDao,
  UserGroupsDao,
  UserPermissionsDao,
  UsersDao,
  UrlsDao,
  UrlLocatorAutoConfirmationDao,
  WritQuoteUrlTargetsDao,
  VidSegmentsDao,
  AppearancesDao,
  AppearanceConfirmationsDao,
} from "../daos";

import { DatabaseProvider } from "./databaseInit";

/** Provides access to DAOs and previous types. */
export type DaosProvider = ReturnType<typeof daosInitializer> &
  DatabaseProvider;

/** Initializes DAOs */
export function daosInitializer(provider: DatabaseProvider) {
  const logger = provider.logger;
  const database = provider.database;

  const accountSettingsDao = new AccountSettingsDao(logger, database);
  const actionsDao = new ActionsDao(database);
  const appearanceConfirmationsDao = new AppearanceConfirmationsDao(database);
  const authDao = new AuthDao(database);
  const usersDao = new UsersDao(database);
  const canonicalUrlsDao = new CanonicalUrlsDao(database);
  const contentReportsDao = new ContentReportsDao(logger, database);
  const urlsDao = new UrlsDao(logger, database);
  const writsDao = new WritsDao(logger, database);
  const jobHistoryDao = new JobHistoryDao(database);
  const justificationScoresDao = new JustificationScoresDao(database);
  const passwordResetRequestsDao = new PasswordResetRequestsDao(database);
  const propositionCompoundsDao = new PropositionCompoundsDao(logger, database);
  const propositionsDao = new PropositionsDao(database, usersDao);
  const picRegionsDao = new PicRegionsDao(logger, database);
  const vidSegmentsDao = new VidSegmentsDao(logger, database);
  const writQuoteUrlTargetsDao = new WritQuoteUrlTargetsDao(logger, database);
  const writQuotesDao = new WritQuotesDao(
    logger,
    database,
    urlsDao,
    writsDao,
    writQuoteUrlTargetsDao
  );
  const sourceExcerptParaphrasesDao = new SourceExcerptParaphrasesDao(
    logger,
    database,
    propositionsDao,
    writQuotesDao,
    picRegionsDao,
    vidSegmentsDao
  );
  const justificationBasisCompoundsDao = new JustificationBasisCompoundsDao(
    logger,
    database,
    sourceExcerptParaphrasesDao
  );
  const statementsDao = new StatementsDao(logger, database, propositionsDao);
  const persorgsDao = new PersorgsDao(logger, database, usersDao);
  const sourcesDao = new SourcesDao(database, usersDao);
  const urlLocatorAutoConfirmationDao = new UrlLocatorAutoConfirmationDao(
    database
  );
  const mediaExcerptsDao = new MediaExcerptsDao(
    logger,
    database,
    urlsDao,
    sourcesDao,
    persorgsDao,
    usersDao,
    urlLocatorAutoConfirmationDao
  );
  const justificationsDao = new JustificationsDao(
    logger,
    database,
    statementsDao,
    propositionCompoundsDao,
    propositionsDao,
    mediaExcerptsDao,
    writQuotesDao,
    justificationBasisCompoundsDao,
    writQuoteUrlTargetsDao
  );
  const permissionsDao = new PermissionsDao(logger, database);
  const perspectivesDao = new PerspectivesDao(logger, database);
  const userExternalIdsDao = new UserExternalIdsDao(database);
  const userGroupsDao = new UserGroupsDao(database);
  const userPermissionsDao = new UserPermissionsDao(database);
  const registrationRequestsDao = new RegistrationRequestsDao(logger, database);
  const justificationVotesDao = new JustificationVotesDao(database);
  const propositionTagVotesDao = new PropositionTagVotesDao(database);
  const propositionTagsDao = new PropositionTagsDao(database, propositionsDao);
  const tagsDao = new TagsDao(logger, database);
  const appearancesDao = new AppearancesDao(database, provider.logger);

  logger.debug("daosInit complete");

  return {
    accountSettingsDao,
    actionsDao,
    appearanceConfirmationsDao,
    appearancesDao,
    authDao,
    canonicalUrlsDao,
    contentReportsDao,
    jobHistoryDao,
    justificationScoresDao,
    justificationVotesDao,
    justificationBasisCompoundsDao,
    justificationsDao,
    mediaExcerptsDao,
    permissionsDao,
    persorgsDao,
    perspectivesDao,
    picRegionsDao,
    sourceExcerptParaphrasesDao,
    passwordResetRequestsDao,
    propositionCompoundsDao,
    propositionsDao,
    propositionTagsDao,
    propositionTagVotesDao,
    registrationRequestsDao,
    statementsDao,
    sourcesDao,
    tagsDao,
    urlsDao,
    urlLocatorAutoConfirmationDao,
    userExternalIdsDao,
    userGroupsDao,
    userPermissionsDao,
    usersDao,
    vidSegmentsDao,
    writQuotesDao,
    writQuoteUrlTargetsDao,
    writsDao,
  };
}
