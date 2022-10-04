const assign = require('lodash/assign')

const {
  AccountSettingsDao,
  ActionsDao,
  AuthDao,
  ContentReportsDao,
  WritQuotesDao,
  WritsDao,
  JobHistoryDao,
  JustificationScoresDao,
  JustificationsDao,
  JustificationBasisCompoundsDao,
  JustificationVotesDao,
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
  TagsDao,
  UserExternalIdsDao,
  UserGroupsDao,
  UserPermissionsDao,
  UsersDao,
  UrlsDao,
  WritQuoteUrlTargetsDao,
  VidSegmentsDao,
} = require('howdju-service-common')

exports.init = function init(provider) {
  const logger = provider.logger
  const database = provider.database

  const accountSettingsDao = new AccountSettingsDao(logger, database)
  const actionsDao = new ActionsDao(database)
  const authDao = new AuthDao(logger, database)
  const contentReportsDao = new ContentReportsDao(logger, database)
  const urlsDao = new UrlsDao(logger, database)
  const writsDao = new WritsDao(logger, database)
  const jobHistoryDao = new JobHistoryDao(database)
  const justificationScoresDao = new JustificationScoresDao(database)
  const passwordResetRequestsDao = new PasswordResetRequestsDao(logger, database)
  const propositionCompoundsDao = new PropositionCompoundsDao(logger, database)
  const propositionsDao = new PropositionsDao(logger, database)
  const picRegionsDao = new PicRegionsDao(logger, database)
  const vidSegmentsDao = new VidSegmentsDao(logger, database)
  const writQuoteUrlTargetsDao = new WritQuoteUrlTargetsDao(logger, database)
  const writQuotesDao = new WritQuotesDao(logger, database, urlsDao, writsDao, writQuoteUrlTargetsDao)
  const sourceExcerptParaphrasesDao = new SourceExcerptParaphrasesDao(logger, database, propositionsDao, writQuotesDao, picRegionsDao, vidSegmentsDao)
  const justificationBasisCompoundsDao = new JustificationBasisCompoundsDao(logger, database, sourceExcerptParaphrasesDao)
  const statementsDao = new StatementsDao(logger, database, propositionsDao)
  const justificationsDao = new JustificationsDao(logger, database, statementsDao, propositionCompoundsDao,
    writQuotesDao, justificationBasisCompoundsDao, writQuoteUrlTargetsDao)
  const permissionsDao = new PermissionsDao(logger, database)
  const persorgsDao = new PersorgsDao(logger, database)
  const perspectivesDao = new PerspectivesDao(logger, database)
  const userExternalIdsDao = new UserExternalIdsDao(database)
  const userGroupsDao = new UserGroupsDao(database)
  const userPermissionsDao = new UserPermissionsDao(database)
  const usersDao = new UsersDao(logger, database)
  const registrationRequestsDao = new RegistrationRequestsDao(logger, database)
  const justificationVotesDao = new JustificationVotesDao(database)
  const propositionTagVotesDao = new PropositionTagVotesDao(logger, database)
  const propositionTagsDao = new PropositionTagsDao(logger, database)
  const tagsDao = new TagsDao(logger, database)

  assign(provider, {
    accountSettingsDao,
    actionsDao,
    authDao,
    contentReportsDao,
    jobHistoryDao,
    justificationScoresDao,
    justificationVotesDao,
    justificationBasisCompoundsDao,
    justificationsDao,
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
    tagsDao,
    urlsDao,
    userExternalIdsDao,
    userGroupsDao,
    userPermissionsDao,
    usersDao,
    vidSegmentsDao,
    writQuotesDao,
    writQuoteUrlTargetsDao,
    writsDao,
  })

  provider.logger.debug('daosInit complete')
}
