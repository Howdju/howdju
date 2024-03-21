import { TopicMessage } from "howdju-common";
import { TestTopicMessageSender } from "howdju-test-common";
import { AsyncConfig } from "..";

import {
  AccountSettingsService,
  ActionsService,
  AuthService,
  AwsTopicMessageSender,
  CanonicalUrlsService,
  ContentReportsService,
  ContextTrailsService,
  DevTopicMessageConsumer,
  DevTopicMessageSender,
  FactChecksService,
  GroupsService,
  JustificationsService,
  JustificationBasisCompoundsService,
  JustificationVotesService,
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
  SourcesService,
  StatementsService,
  TagsService,
  UrlLocatorAutoConfirmationService,
  UrlsService,
  UsersService,
  VidSegmentsService,
  WritsService,
  WritQuotesService,
  EmailService,
  AppearancesService,
  AppearanceConfirmationsService,
} from "../services";
import { AwsProvider } from "./awsInit";
import { AppConfigProvider } from "./BaseProvider";

/** Provides the services and previous providers. */
export type ServicesProvider = ReturnType<typeof servicesInitializer> &
  AwsProvider &
  AppConfigProvider;

/** Initializes the services. */
export function servicesInitializer(
  provider: AwsProvider & AppConfigProvider,
  asyncConfig: Promise<AsyncConfig>
) {
  const devTopicQueue = [] as TopicMessage[];
  const topicMessageSender = makeTopicMessageSender(provider, devTopicQueue);

  const actionsService = new ActionsService(provider.actionsDao);
  const authService = new AuthService(
    provider.appConfig,
    provider.authDao,
    provider.usersDao
  );

  const permissionsService = new PermissionsService(
    provider.permissionsDao,
    provider.userPermissionsDao
  );

  const writsService = new WritsService(actionsService, provider.writsDao);
  const canonicalUrlsService = new CanonicalUrlsService(
    asyncConfig,
    provider.canonicalUrlsDao
  );
  const urlsService = new UrlsService(
    provider.logger,
    canonicalUrlsService,
    provider.urlsDao,
    topicMessageSender
  );
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
  const tagsService = new TagsService(provider.tagsDao);
  const propositionTagVotesService = new PropositionTagVotesService(
    provider.logger,
    authService,
    tagsService,
    provider.propositionTagVotesDao
  );

  const propositionTagsService = new PropositionTagsService(
    provider.propositionTagsDao
  );

  const propositionsService = new PropositionsService(
    provider.appConfig,
    actionsService,
    authService,
    tagsService,
    propositionTagsService,
    propositionTagVotesService,
    provider.propositionsDao,
    provider.permissionsDao,
    provider.justificationsDao
  );

  const usersService = new UsersService(
    provider.appConfig,
    actionsService,
    authService,
    permissionsService,
    provider.userExternalIdsDao,
    provider.usersDao,
    provider.accountSettingsDao
  );

  const persorgsService = new PersorgsService(
    provider.appConfig,
    authService,
    permissionsService,
    usersService,
    provider.persorgsDao
  );

  const statementsService = new StatementsService(
    authService,
    provider.statementsDao,
    persorgsService,
    propositionsService,
    usersService
  );

  const propositionCompoundsService = new PropositionCompoundsService(
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
    authService,
    permissionsService,
    provider.sourcesDao
  );

  const mediaExcerptsService = new MediaExcerptsService(
    provider.appConfig,
    topicMessageSender,
    authService,
    permissionsService,
    provider.mediaExcerptsDao,
    sourcesService,
    persorgsService,
    urlsService
  );

  const urlLocatorAutoConfirmationService =
    new UrlLocatorAutoConfirmationService(
      provider.logger,
      asyncConfig,
      mediaExcerptsService,
      provider.urlLocatorAutoConfirmationDao
    );

  const devTopicMessageConsumer =
    process.env.NODE_ENV === "development"
      ? new DevTopicMessageConsumer(
          devTopicQueue,
          urlLocatorAutoConfirmationService,
          urlsService
        )
      : undefined;

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
  const justificationVotesService = new JustificationVotesService(
    provider.logger,
    provider.justificationVoteValidator,
    authService,
    provider.justificationVotesDao
  );

  const registrationService = new RegistrationService(
    provider.logger,
    provider.appConfig,
    topicMessageSender,
    usersService,
    authService,
    provider.registrationRequestsDao
  );

  const passwordResetService = new PasswordResetService(
    provider.logger,
    provider.appConfig,
    topicMessageSender,
    usersService,
    authService,
    provider.passwordResetRequestsDao
  );

  const contentReportsService = new ContentReportsService(
    provider.appConfig,
    provider.logger,
    authService,
    usersService,
    topicMessageSender,
    provider.contentReportsDao
  );

  const mediaExcerptInfosService = new MediaExcerptInfosService(
    asyncConfig,
    provider.mediaExcerptsDao
  );
  const emailService = new EmailService(provider.logger, provider.sesv2);

  const appearanceConfirmationsService = new AppearanceConfirmationsService(
    authService,
    provider.appearanceConfirmationsDao
  );

  const appearancesService = new AppearancesService(
    authService,
    mediaExcerptsService,
    propositionsService,
    appearanceConfirmationsService,
    usersService,
    provider.appearancesDao
  );

  const factChecksService = new FactChecksService(
    appearancesService,
    usersService,
    urlsService,
    sourcesService
  );

  const contextTrailsService = new ContextTrailsService(
    provider.logger,
    authService,
    justificationsService,
    appearancesService
  );

  provider.logger.debug("servicesInit complete");

  return {
    accountSettingsService,
    actionsService,
    appearanceConfirmationsService,
    appearancesService,
    authService,
    canonicalUrlsService,
    contentReportsService,
    contextTrailsService,
    devTopicMessageConsumer,
    emailService,
    factChecksService,
    groupsService,
    justificationsService,
    justificationBasisCompoundsService,
    justificationVotesService,
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
    urlLocatorAutoConfirmationService,
    usersService,
    writQuotesService,
    writsService,
  };
}

function makeTopicMessageSender(
  provider: AwsProvider,
  devTopicQueue: TopicMessage[]
) {
  if (process.env.NODE_ENV === "test") {
    return new TestTopicMessageSender();
  }
  if (process.env.NODE_ENV === "development") {
    return new DevTopicMessageSender(devTopicQueue);
  }

  const topicArn = provider.getConfigVal("MESSAGES_TOPIC_ARN");
  if (!topicArn) {
    throw new Error("MESSAGES_TOPIC_ARN env var must be present in prod.");
  }
  return new AwsTopicMessageSender(provider.logger, provider.sns, topicArn);
}
