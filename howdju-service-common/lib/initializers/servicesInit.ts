import {
  AccountSettingsService,
  ActionsService,
  AuthService,
  ContentReportsService,
  ContextTrailsService,
  GroupsService,
  JustificationsService,
  JustificationBasisCompoundsService,
  JustificationVotesService,
  MainSearchService,
  MediaExcerptsService,
  MediaExcerptInfosService,
  PermissionsService,
  PerspectivesService,
  PicRegionsService,
  RegistrationService,
  SourceExcerptParaphrasesService,
  PasswordResetService,
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
  SourcesService,
} from "../services";
import { AwsProvider } from "./awsInit";

/** Provides the services and previous providers. */
export type ServicesProvider = ReturnType<typeof servicesInitializer> &
  AwsProvider;

/** Initializes the services. */
export function servicesInitializer(provider: AwsProvider) {
  const actionsService = new ActionsService(provider.actionsDao);
  const authService = new AuthService(
    provider.appConfig,
    provider.logger,
    provider.credentialValidator,
    provider.authDao,
    provider.usersDao
  );

  const permissionsService = new PermissionsService(
    provider.permissionsDao,
    provider.userPermissionsDao
  );

  const writsService = new WritsService(actionsService, provider.writsDao);
  const urlsService = new UrlsService(provider.urlsDao);
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
  );
  const tagsService = new TagsService(provider.logger, provider.tagsDao);
  const propositionTagVotesService = new PropositionTagVotesService(
    provider.logger,
    provider.propositionTagVoteValidator,
    authService,
    tagsService,
    provider.propositionTagVotesDao
  );

  const propositionTagsService = new PropositionTagsService(
    provider.logger,
    provider.propositionTagsDao
  );

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
  );

  const persorgsService = new PersorgsService(
    provider.appConfig,
    authService,
    permissionsService,
    provider.persorgsDao,
    provider.mediaExcerptsDao
  );

  const statementsService = new StatementsService(
    provider.logger,
    authService,
    provider.statementsDao,
    persorgsService,
    propositionsService
  );

  const propositionCompoundsService = new PropositionCompoundsService(
    provider.propositionCompoundValidator,
    actionsService,
    propositionsService,
    provider.propositionCompoundsDao
  );
  const groupsService = new GroupsService(
    provider.logger,
    provider.userGroupsDao
  );

  const picRegionsService = new PicRegionsService();
  const vidSegmentsService = new VidSegmentsService();
  const sourceExcerptParaphrasesService = new SourceExcerptParaphrasesService(
    provider.logger,
    actionsService,
    propositionsService,
    writQuotesService,
    picRegionsService,
    vidSegmentsService,
    provider.sourceExcerptParaphrasesDao,
    authService
  );
  const justificationBasisCompoundsService =
    new JustificationBasisCompoundsService(
      provider.logger,
      provider.justificationBasisCompoundValidator,
      actionsService,
      propositionsService,
      sourceExcerptParaphrasesService,
      provider.justificationBasisCompoundsDao
    );

  const sourcesService = new SourcesService(
    provider.appConfig,
    provider.logger,
    authService,
    permissionsService,
    provider.sourcesDao,
    provider.mediaExcerptsDao
  );

  const mediaExcerptsService = new MediaExcerptsService(
    authService,
    provider.mediaExcerptsDao,
    sourcesService,
    persorgsService,
    urlsService
  );

  const justificationsService = new JustificationsService(
    provider.appConfig,
    provider.logger,
    actionsService,
    authService,
    propositionsService,
    statementsService,
    writQuotesService,
    propositionCompoundsService,
    mediaExcerptsService,
    justificationBasisCompoundsService,
    provider.justificationsDao,
    provider.permissionsDao
  );

  const perspectivesService = new PerspectivesService(
    provider.authDao,
    provider.perspectivesDao
  );
  const rootTargetJustificationsService = new RootTargetJustificationsService(
    authService,
    propositionsService,
    statementsService,
    justificationsService
  );
  const accountSettingsService = new AccountSettingsService(
    provider.logger,
    authService,
    provider.accountSettingsDao
  );
  const usersService = new UsersService(
    provider.userValidator,
    actionsService,
    authService,
    permissionsService,
    provider.userExternalIdsDao,
    provider.usersDao,
    provider.accountSettingsDao
  );
  const justificationVotesService = new JustificationVotesService(
    provider.logger,
    provider.justificationVoteValidator,
    authService,
    provider.justificationVotesDao
  );

  const mainSearchService = new MainSearchService(
    tagsService,
    provider.propositionsTextSearcher,
    provider.sourceDescriptionSearcher,
    provider.mediaExcerptsSearcher,
    mediaExcerptsService,
    provider.writsTitleSearcher,
    provider.writQuotesQuoteTextSearcher,
    writQuotesService,
    provider.persorgsNameSearcher
  );

  const registrationService = new RegistrationService(
    provider.logger,
    provider.appConfig,
    provider.topicMessageSender,
    usersService,
    authService,
    provider.registrationRequestsDao
  );

  const passwordResetService = new PasswordResetService(
    provider.logger,
    provider.appConfig,
    provider.topicMessageSender,
    usersService,
    authService,
    provider.passwordResetRequestsDao
  );

  const contentReportsService = new ContentReportsService(
    provider.appConfig,
    provider.logger,
    authService,
    usersService,
    provider.topicMessageSender,
    provider.contentReportsDao
  );

  const contextTrailsService = new ContextTrailsService(
    provider.logger,
    authService,
    justificationsService
  );

  const mediaExcerptInfosService = new MediaExcerptInfosService();

  provider.logger.debug("servicesInit complete");

  return {
    accountSettingsService,
    actionsService,
    authService,
    contentReportsService,
    contextTrailsService,
    groupsService,
    justificationsService,
    justificationBasisCompoundsService,
    justificationVotesService,
    mainSearchService,
    mediaExcerptsService,
    mediaExcerptInfosService,
    permissionsService,
    perspectivesService,
    sourceExcerptParaphrasesService,
    passwordResetService,
    persorgsService,
    propositionsService,
    propositionCompoundsService,
    propositionTagsService,
    propositionTagVotesService,
    registrationService,
    rootTargetJustificationsService,
    sourcesService,
    statementsService,
    tagsService,
    urlsService,
    usersService,
    writQuotesService,
    writsService,
  };
}
