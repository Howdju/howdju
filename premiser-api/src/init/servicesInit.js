const assign = require('lodash/assign')

const {
  ActionsService,
  AuthService,
  WritQuotesService,
  WritsService,
  GroupsService,
  JustificationsService,
  JustificationBasisCompoundsService,
  JustificationVotesService,
  MainSearchService,
  PermissionsService,
  PerspectivesService,
  PicRegionsService,
  SourceExcerptParaphrasesService,
  StatementsService,
  StatementCompoundsService,
  StatementJustificationsService,
  StatementTagVotesService,
  StatementTagsService,
  TagsService,
  UrlsService,
  UsersService,
  VidSegmentsService,
} = require('howdju-service-common')


exports.init = function init(provider) {
  const actionsService = new ActionsService(
    provider.actionsDao
  )
  const authService = new AuthService(
    provider.appConfig,
    provider.logger,
    provider.credentialValidator,
    provider.authDao,
    provider.usersDao
  )
  const writsService = new WritsService(
    actionsService,
    provider.writsDao
  )
  const urlsService = new UrlsService(
    actionsService,
    provider.urlsDao
  )
  const writQuotesService = new WritQuotesService(
    provider.logger,
    provider.writQuoteValidator,
    actionsService,
    authService,
    writsService,
    urlsService,
    provider.writQuotesDao,
    provider.writsDao,
    provider.permissionsDao
  )
  const tagsService = new TagsService(
    provider.logger,
    provider.tagsDao
  )
  const statementTagVotesService = new StatementTagVotesService(
    provider.logger,
    provider.statementTagVoteValidator,
    authService,
    tagsService,
    provider.statementTagVotesDao
  )

  const statementTagsService = new StatementTagsService(
    provider.logger,
    provider.statementTagsDao
  )

  const statementsService = new StatementsService(
    provider.appConfig,
    provider.statementValidator,
    actionsService,
    authService,
    statementTagsService,
    statementTagVotesService,
    tagsService,
    provider.statementsDao,
    provider.permissionsDao,
    provider.justificationsDao
  )
  const statementCompoundsService = new StatementCompoundsService(
    provider.statementCompoundValidator,
    actionsService,
    statementsService,
    provider.statementCompoundsDao
  )
  const groupsService = new GroupsService(
    provider.logger,
    provider.userGroupsDao
  )

  const picRegionsService = new PicRegionsService()
  const vidSegmentsService = new VidSegmentsService()
  const sourceExcerptParaphrasesService = new SourceExcerptParaphrasesService(
    provider.logger,
    actionsService,
    statementsService,
    writQuotesService,
    picRegionsService,
    vidSegmentsService,
    provider.sourceExcerptParaphrasesDao
  )
  const justificationBasisCompoundsService = new JustificationBasisCompoundsService(
    provider.logger,
    provider.justificationBasisCompoundValidator,
    actionsService,
    statementsService,
    sourceExcerptParaphrasesService,
    provider.justificationBasisCompoundsDao
  )

  const justificationsService = new JustificationsService(
    provider.appConfig,
    provider.logger,
    provider.justificationValidator,
    actionsService,
    authService,
    statementsService,
    writQuotesService,
    statementCompoundsService,
    justificationBasisCompoundsService,
    provider.justificationsDao,
    provider.permissionsDao
  )

  const permissionsService = new PermissionsService(
    provider.permissionsDao,
    provider.userPermissionsDao
  )
  const perspectivesService = new PerspectivesService(
    provider.authDao,
    provider.perspectivesDao
  )
  const statementJustificationsService = new StatementJustificationsService(
    authService,
    statementsService,
    justificationsService
  )
  const usersService = new UsersService(
    provider.userValidator,
    actionsService,
    authService,
    permissionsService,
    provider.userExternalIdsDao,
    provider.usersDao
  )
  const justificationVotesService = new JustificationVotesService(
    provider.logger,
    provider.justificationVoteValidator,
    authService,
    provider.justificationVotesDao
  )

  const mainSearchService = new MainSearchService(
    provider.logger,
    provider.statementsTextSearcher,
    provider.writsTitleSearcher,
    provider.writQuotesQuoteTextSearcher,
    writQuotesService
  )

  assign(provider, {
    actionsService,
    authService,
    groupsService,
    justificationsService,
    justificationBasisCompoundsService,
    justificationVotesService,
    mainSearchService,
    permissionsService,
    perspectivesService,
    sourceExcerptParaphrasesService,
    statementsService,
    statementCompoundsService,
    statementJustificationsService,
    statementTagsService,
    statementTagVotesService,
    tagsService,
    urlsService,
    usersService,
    writQuotesService,
    writsService,
  })
}