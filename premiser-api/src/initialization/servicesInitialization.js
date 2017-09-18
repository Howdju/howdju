const {
  ActionsService,
  AuthService,
  WritQuotesService,
  WritsService,
  GroupsService,
  JustificationsService,
  JustificationBasisCompoundsService,
  PermissionsService,
  PerspectivesService,
  PicRegionsService,
  SourceExcerptParaphrasesService,
  StatementCompoundsService,
  StatementJustificationsService,
  StatementsService,
  UrlsService,
  UsersService,
  VidSegmentsService,
  VotesService,
} = require('howdju-service-common')

const config = require('../config')
const {
  logger
} = require('./loggerInitialization')
const {
  credentialValidator,
  writQuoteValidator,
  justificationValidator,
  justificationBasisCompoundValidator,
  statementCompoundValidator,
  statementValidator,
  userValidator,
  voteValidator,
} = require('./validatorsInitialization')
const {
  actionsDao,
  authDao,
  writsDao,
  writQuotesDao,
  justificationsDao,
  justificationBasisCompoundsDao,
  permissionsDao,
  perspectivesDao,
  sourceExcerptParaphrasesDao,
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
const writsService = new WritsService(actionsService, writsDao)
const urlsService = new UrlsService(actionsService, urlsDao)
const writQuotesService = new WritQuotesService(
  logger,
  writQuoteValidator,
  actionsService,
  authService,
  writsService,
  urlsService,
  writQuotesDao,
  writsDao,
  permissionsDao
)
const statementsService = new StatementsService(config, statementValidator, actionsService, authService, statementsDao,
  permissionsDao, justificationsDao)
const statementCompoundsService = new StatementCompoundsService(statementCompoundValidator, actionsService,
  statementsService, statementCompoundsDao)
const groupsService = new GroupsService(logger, userGroupsDao)

const picRegionsService = new PicRegionsService()
const vidSegmentsService = new VidSegmentsService()
const sourceExcerptParaphrasesService = new SourceExcerptParaphrasesService(
  logger,
  sourceExcerptParaphrasesDao,
  statementsService,
  writQuotesService,
  picRegionsService,
  vidSegmentsService
)
const justificationBasisCompoundsService = new JustificationBasisCompoundsService(
  logger,
  justificationBasisCompoundValidator,
  actionsService,
  statementsService,
  sourceExcerptParaphrasesService,
  justificationBasisCompoundsDao
)

const justificationsService = new JustificationsService(config, logger, justificationValidator, actionsService,
  authService, statementsService, writQuotesService, statementCompoundsService, justificationBasisCompoundsService,
  justificationsDao, permissionsDao)

const permissionsService = new PermissionsService(permissionsDao, userPermissionsDao)
const perspectivesService = new PerspectivesService(authDao, perspectivesDao)
const statementJustificationsService = new StatementJustificationsService(authService, statementsDao, justificationsDao)
const usersService = new UsersService(userValidator, actionsService, authService, permissionsService,
  userExternalIdsDao, usersDao)
const votesService = new VotesService(logger, voteValidator, authService, votesDao)

module.exports = {
  actionsService,
  authService,
  writQuotesService,
  writsService,
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