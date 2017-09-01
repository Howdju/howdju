const {
  ActionsDao,
  AuthDao,
  CitationReferencesDao,
  CitationsDao,
  JobHistoryDao,
  JustificationScoresDao,
  JustificationsDao,
  PermissionsDao,
  PerspectivesDao,
  StatementCompoundsDao,
  StatementsDao,
  UserExternalIdsDao,
  UserGroupsDao,
  UserPermissionsDao,
  UsersDao,
  UrlsDao,
  VotesDao,
} = require('howdju-service-common')
const {
  database,
} = require('./databaseInitialization')
const {
  logger
} = require('./loggerInitialization')

exports.actionsDao = new ActionsDao(database)
exports.authDao = new AuthDao(database)

exports.urlsDao = new UrlsDao(logger, database)
exports.citationReferencesDao = new CitationReferencesDao(logger, database, exports.urlsDao)

exports.citationsDao = new CitationsDao(logger, database)
exports.jobHistoryDao = new JobHistoryDao(database)
exports.justificationScoresDao = new JustificationScoresDao(database)

exports.statementCompoundsDao = new StatementCompoundsDao(logger, database)
exports.justificationsDao = new JustificationsDao(logger, database, exports.statementCompoundsDao, exports.citationReferencesDao)

exports.permissionsDao = new PermissionsDao(logger, database)
exports.perspectivesDao = new PerspectivesDao(logger, database)
exports.statementsDao = new StatementsDao(logger, database)
exports.userExternalIdsDao = new UserExternalIdsDao(database)
exports.userGroupsDao = new UserGroupsDao(database)
exports.userPermissionsDao = new UserPermissionsDao(database)
exports.usersDao = new UsersDao(database)
exports.votesDao = new VotesDao(database)
