const {
  ActionsService,
  AuthService,
  WritingQuotesService,
  WritingsService,
  GroupsService,
  JustificationsService,
  PermissionsService,
  PerspectivesService,
  StatementCompoundsService,
  StatementJustificationsService,
  StatementsService,
  UrlsService,
  UsersService,
  VotesService,
} = require('howdju-service-common')

const config = require('../config')
const {
  logger
} = require('./loggerInitialization')
const {
  credentialValidator,
  writingQuoteValidator,
  justificationValidator,
  statementCompoundValidator,
  statementValidator,
  userValidator,
  voteValidator,
} = require('./validatorsInitialization')
const {
  actionsDao,
  authDao,
  writingsDao,
  writingQuotesDao,
  justificationsDao,
  permissionsDao,
  perspectivesDao,
  statementsDao,
  statementCompoundsDao,
  urlsDao,
  usersDao,
  userExternalIdsDao,
  votesDao,
  userGroupsDao,
  userPermissionsDao,
} = require('./daosInitialization')


const actionsService = new ActionsService(actionsDao)
const authService = new AuthService(config, logger, credentialValidator, authDao, usersDao)
const writingsService = new WritingsService(actionsService, writingsDao)
const urlsService = new UrlsService(actionsService, urlsDao)
const writingQuotesService = new WritingQuotesService(
  logger,
  writingQuoteValidator,
  actionsService,
  authService,
  writingsService,
  urlsService,
  writingQuotesDao,
  writingsDao,
  permissionsDao
)
const statementsService = new StatementsService(config, statementValidator, actionsService, authService, statementsDao,
  permissionsDao, justificationsDao)
const statementCompoundsService = new StatementCompoundsService(statementCompoundValidator, actionsService,
  statementsService, statementCompoundsDao)
const groupsService = new GroupsService(logger, userGroupsDao)
const justificationsService = new JustificationsService(config, logger, justificationValidator, actionsService,
  authService, statementsService, writingQuotesService, statementCompoundsService, justificationsDao,
  permissionsDao)
const permissionsService = new PermissionsService(permissionsDao, userPermissionsDao)
const perspectivesService = new PerspectivesService(authDao, perspectivesDao)
const statementJustificationsService = new StatementJustificationsService(statementsDao, justificationsDao)
const usersService = new UsersService(userValidator, actionsService, authService, permissionsService,
  userExternalIdsDao, usersDao)
const votesService = new VotesService(logger, voteValidator, authService, votesDao)

module.exports = {
  actionsService,
  authService,
  writingQuotesService,
  writingsService,
  groupsService,
  justificationsService,
  permissionsService,
  perspectivesService,
  statementCompoundsService,
  statementJustificationsService,
  statementsService,
  urlsService,
  usersService,
  votesService,
}