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
} = require('./daosInitialization')
const {
  ActionsService,
  AuthService,
  CitationReferencesService,
  CitationsService,
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
const justificationsService = new JustificationsService(config, logger, justificationValidator, actionsService,
  authService, justificationsDao, permissionsDao)
const permissionsService = new PermissionsService(permissionsDao)
const perspectivesService = new PerspectivesService(authDao, perspectivesDao)
const statementsService = new StatementsService(config, statementValidator, actionsService, authService, statementsDao,
  permissionsDao, justificationsDao)
const statementCompoundsService = new StatementCompoundsService(statementCompoundValidator, actionsService,
  statementsService, statementCompoundsDao)
const statementJustificationsService = new StatementJustificationsService(statementsDao, justificationsDao)
const usersService = new UsersService(userValidator, actionsService, authService, permissionsService,
  userExternalIdsDao, usersDao)
const votesService = new VotesService(logger, voteValidator, authService, votesDao)

module.exports = {
  actionsService,
  authService,
  citationReferencesService,
  citationsService,
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