const assign = require('lodash/assign')

const {
  ActionsService,
  AuthService,
  DevEmailService,
  EmailService,
  GroupsService,
  JustificationsService,
  JustificationBasisCompoundsService,
  JustificationVotesService,
  MainSearchService,
  PermissionsService,
  PerspectivesService,
  PicRegionsService,
  RegistrationsService,
  SourceExcerptParaphrasesService,
  PersorgsService,
  PropositionsService,
  PropositionCompoundsService,
  RootTargetJustificationsService,
  PropositionTagVotesService,
  PropositionTagsService,
  StatementsService,
  TagsService,
  UrlsService,
  UsersService,
  VidSegmentsService,
  WritsService,
  WritQuotesService,
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

  const permissionsService = new PermissionsService(
    provider.permissionsDao,
    provider.userPermissionsDao
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
  const propositionTagVotesService = new PropositionTagVotesService(
    provider.logger,
    provider.propositionTagVoteValidator,
    authService,
    tagsService,
    provider.propositionTagVotesDao
  )

  const propositionTagsService = new PropositionTagsService(
    provider.logger,
    provider.propositionTagsDao
  )

  const propositionsService = new PropositionsService(
    provider.appConfig,
    provider.propositionValidator,
    actionsService,
    authService,
    propositionTagsService,
    propositionTagVotesService,
    tagsService,
    provider.propositionsDao,
    provider.permissionsDao,
    provider.justificationsDao
  )

  const persorgsService = new PersorgsService(provider.logger, authService, permissionsService, provider.persorgsDao)

  const statementsService = new StatementsService(
    provider.logger,
    authService,
    provider.statementsDao,
    persorgsService,
    propositionsService,
  )

  const propositionCompoundsService = new PropositionCompoundsService(
    provider.propositionCompoundValidator,
    actionsService,
    propositionsService,
    provider.propositionCompoundsDao
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
    propositionsService,
    writQuotesService,
    picRegionsService,
    vidSegmentsService,
    provider.sourceExcerptParaphrasesDao
  )
  const justificationBasisCompoundsService = new JustificationBasisCompoundsService(
    provider.logger,
    provider.justificationBasisCompoundValidator,
    actionsService,
    propositionsService,
    sourceExcerptParaphrasesService,
    provider.justificationBasisCompoundsDao
  )

  const justificationsService = new JustificationsService(
    provider.appConfig,
    provider.logger,
    actionsService,
    authService,
    propositionsService,
    statementsService,
    writQuotesService,
    propositionCompoundsService,
    justificationBasisCompoundsService,
    provider.justificationsDao,
    provider.permissionsDao
  )

  const perspectivesService = new PerspectivesService(
    provider.authDao,
    provider.perspectivesDao
  )
  const rootTargetJustificationsService = new RootTargetJustificationsService(
    authService,
    propositionsService,
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
    tagsService,
    provider.propositionsTextSearcher,
    provider.writsTitleSearcher,
    provider.writQuotesQuoteTextSearcher,
    writQuotesService,
    provider.persorgsNameSearcher
  )

  const emailService = provider.isProduction ?
    new EmailService(provider.logger, provider.ses) :
    new DevEmailService(provider.logger)
  
  const registrationsService = new RegistrationsService(
    provider.logger, 
    provider.appConfig, 
    emailService,
    usersService,
    authService,
    provider.registrationsDao,
  )

  assign(provider, {
    actionsService,
    authService,
    emailService,
    groupsService,
    justificationsService,
    justificationBasisCompoundsService,
    justificationVotesService,
    mainSearchService,
    permissionsService,
    perspectivesService,
    sourceExcerptParaphrasesService,
    persorgsService,
    propositionsService,
    propositionCompoundsService,
    propositionTagsService,
    propositionTagVotesService,
    registrationsService,
    rootTargetJustificationsService,
    statementsService,
    tagsService,
    urlsService,
    usersService,
    writQuotesService,
    writsService,
  })
}