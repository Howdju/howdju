const assign = require('lodash/assign')

const {
  ActionsDao,
  AuthDao,
  WritQuotesDao,
  WritsDao,
  JobHistoryDao,
  JustificationScoresDao,
  JustificationsDao,
  JustificationBasisCompoundsDao,
  PermissionsDao,
  PerspectivesDao,
  PicRegionsDao,
  SourceExcerptParaphrasesDao,
  StatementCompoundsDao,
  StatementsDao,
  UserExternalIdsDao,
  UserGroupsDao,
  UserPermissionsDao,
  UsersDao,
  UrlsDao,
  VotesDao,
  VidSegmentsDao,
} = require('howdju-service-common')

exports.init = function init(provider) {
  const logger = provider.logger
  const database = provider.database

  const actionsDao = new ActionsDao(database)
  const authDao = new AuthDao(logger, database)
  const urlsDao = new UrlsDao(logger, database)
  const writQuotesDao = new WritQuotesDao(logger, database, urlsDao)
  const writsDao = new WritsDao(logger, database)
  const jobHistoryDao = new JobHistoryDao(database)
  const justificationScoresDao = new JustificationScoresDao(database)
  const statementCompoundsDao = new StatementCompoundsDao(logger, database)
  const statementsDao = new StatementsDao(logger, database)
  const picRegionsDao = new PicRegionsDao(logger, database)
  const vidSegmentsDao = new VidSegmentsDao(logger, database)
  const sourceExcerptParaphrasesDao = new SourceExcerptParaphrasesDao(logger, database, statementsDao, writQuotesDao, picRegionsDao, vidSegmentsDao)
  const justificationBasisCompoundsDao = new JustificationBasisCompoundsDao(logger, database, sourceExcerptParaphrasesDao)
  const justificationsDao = new JustificationsDao(logger, database, statementCompoundsDao, writQuotesDao, justificationBasisCompoundsDao)
  const permissionsDao = new PermissionsDao(logger, database)
  const perspectivesDao = new PerspectivesDao(logger, database)
  const userExternalIdsDao = new UserExternalIdsDao(database)
  const userGroupsDao = new UserGroupsDao(database)
  const userPermissionsDao = new UserPermissionsDao(database)
  const usersDao = new UsersDao(logger, database)
  const votesDao = new VotesDao(database)

  assign(provider, {
    actionsDao,
    authDao,
    urlsDao,
    writQuotesDao,
    writsDao,
    jobHistoryDao,
    justificationScoresDao,
    statementCompoundsDao,
    statementsDao,
    picRegionsDao,
    vidSegmentsDao,
    sourceExcerptParaphrasesDao,
    justificationBasisCompoundsDao,
    justificationsDao,
    permissionsDao,
    perspectivesDao,
    userExternalIdsDao,
    userGroupsDao,
    userPermissionsDao,
    usersDao,
    votesDao,
  })
}
