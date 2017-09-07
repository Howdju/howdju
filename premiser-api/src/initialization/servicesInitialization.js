const {
  ActionsService,
  AuthService,
  CitationReferencesService,
  CitationsService,
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
  citationReferenceValidator,
  justificationValidator,
  statementCompoundValidator,
  statementValidator,
  userValidator,
  voteValidator,
} = require('./validatorsInitialization')
const {
  actionsDao,
  authDao,
  citationsDao,
  citationReferencesDao,
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
const citationsService = new CitationsService(actionsService, citationsDao)
const urlsService = new UrlsService(actionsService, urlsDao)
const citationReferencesService = new CitationReferencesService(
  logger,
  citationReferenceValidator,
  actionsService,
  authService,
  citationsService,
  urlsService,
  citationReferencesDao,
  citationsDao,
  permissionsDao
)
const statementsService = new StatementsService(config, statementValidator, actionsService, authService, statementsDao,
  permissionsDao, justificationsDao)
const statementCompoundsService = new StatementCompoundsService(statementCompoundValidator, actionsService,
  statementsService, statementCompoundsDao)
const groupsService = new GroupsService(logger, userGroupsDao)
const justificationsService = new JustificationsService(config, logger, justificationValidator, actionsService,
  authService, statementsService, citationReferencesService, statementCompoundsService, justificationsDao,
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
  citationReferencesService,
  citationsService,
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