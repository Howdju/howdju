import { concat, merge, uniqBy, uniqWith, zip } from "lodash";
import { Moment } from "moment";

import {
  ContinuationToken,
  CreateMediaExcerpt,
  CreateMediaExcerptCitation,
  CreateUrlLocator,
  DeleteMediaExcerptCitation,
  EntityId,
  makeModelErrors,
  MediaExcerptCitationOut,
  MediaExcerptOut,
  MediaExcerptSearchFilter,
  momentAdd,
  newImpossibleError,
  PersorgOut,
  SortDescription,
  SourceOut,
  TopicMessageSender,
  UrlOut,
  UserBlurb,
  utcNow,
} from "howdju-common";

import { AuthService } from "./AuthService";
import { SourcesService } from "./SourcesService";
import { MediaExcerptsDao } from "../daos";
import { PersorgsService } from "./PersorgsService";
import { UrlsService } from "./UrlsService";
import { UserIdent } from "./types";
import {
  ApiConfig,
  AuthorizationError,
  EntityNotFoundError,
  EntityTooOldToModifyError,
  PermissionsService,
  RequestValidationError,
} from "..";
import {
  createContinuationToken,
  createNextContinuationToken,
  decodeContinuationToken,
} from "./pagination";
import { ensurePresent, retryTransaction } from "./patterns";

// Must be greater than the number MediaExcerpts targeting the same URL or Source that we want
// to succeed creating in parallel.
const CREATE_MEDIA_EXCERPT_RETRIES = 10;
const CREATE_URL_LOCATOR_RETRIES = 3;
const CREATE_CITATION_RETRIES = 3;
export class MediaExcerptsService {
  constructor(
    private readonly config: ApiConfig,
    private readonly topicMessageSender: TopicMessageSender,
    private readonly authService: AuthService,
    private readonly permissionsService: PermissionsService,
    private readonly mediaExcerptsDao: MediaExcerptsDao,
    private readonly sourcesService: SourcesService,
    private readonly persorgsService: PersorgsService,
    private readonly urlsService: UrlsService
  ) {}

  async readMediaExcerptForId(id: EntityId): Promise<MediaExcerptOut> {
    const mediaExcerpt = await this.mediaExcerptsDao.readMediaExcerptForId(id);
    if (!mediaExcerpt) {
      throw new EntityNotFoundError("MEDIA_EXCERPT", id);
    }
    return mediaExcerpt;
  }

  async readMediaExcerptForIds(
    mediaExcerptIds: EntityId[]
  ): Promise<MediaExcerptOut[]> {
    const mediaExcerpts = await this.mediaExcerptsDao.readMediaExcerptsForIds(
      mediaExcerptIds
    );
    ensurePresent(mediaExcerptIds, mediaExcerpts, "MEDIA_EXCERPT");
    return mediaExcerpts;
  }

  async readOrCreateMediaExcerpt(
    userIdent: UserIdent,
    createMediaExcerpt: CreateMediaExcerpt
  ): Promise<{ isExtant: boolean; mediaExcerpt: MediaExcerptOut }> {
    const creator = await this.authService.readUserBlurbForUserIdent(userIdent);
    const createdAt = utcNow();
    const createCitations = createMediaExcerpt.citations ?? [];
    const createUrlLocators = createMediaExcerpt.locators?.urlLocators ?? [];

    // Create entities that don't depend on the media excerpt's ID
    const createUrls = createUrlLocators.map((u) => u.url);
    const [
      { sources, isExtant: isExtantSources },
      { persorgs: speakerPersorgs, isExtant: isExtantPersorgs },
      urls,
    ] = await Promise.all([
      this.sourcesService.readOrCreateSources(
        creator.id,
        createCitations.map((c) => c.source),
        createdAt
      ),
      createMediaExcerpt.speakers
        ? this.persorgsService.readOrCreatePersorgs(
            creator.id,
            createMediaExcerpt.speakers.map((s) => s.persorg),
            createdAt
          )
        : { persorgs: [], isExtant: true },
      this.urlsService.readOrCreateUrlsAsUser(
        createUrls,
        creator.id,
        createdAt
      ),
    ]);

    // Create entities that depend on the media excerpt's ID
    const createUrlLocatorsWithUrl = zip(createUrlLocators, urls).map(
      ([urlLocator, url]) => {
        if (!urlLocator || !url) {
          throw newImpossibleError(
            `createUrlLocators and urls must match in length because urls is based off of createUrlLocators.`
          );
        }
        return {
          ...urlLocator,
          url: url,
        };
      }
    );
    const createCitationsWithSource = zip(createCitations, sources).map(
      ([createCitation, source]) => {
        if (!createCitation || !source) {
          throw newImpossibleError(
            `createCitations and sources must have the same length because sources was based off of createCitations.`
          );
        }
        return {
          ...createCitation,
          source,
        };
      }
    );

    const { mediaExcerpt, isExtant: isExtantMediaExcerpt } =
      await this.readOrCreateMediaExcerptWithRetry(
        createMediaExcerpt,
        creator.id,
        createdAt,
        createUrlLocatorsWithUrl,
        createCitationsWithSource
      );
    if (!isExtantMediaExcerpt) {
      for (const urlLocator of mediaExcerpt.locators.urlLocators) {
        await this.topicMessageSender.sendMessage({
          type: "AUTO_CONFIRM_URL_LOCATOR",
          params: {
            urlLocatorId: urlLocator.id,
          },
        });
      }
    }

    const [
      { urlLocators, isExtant: isExtantUrlLocators },
      { citations, isExtant: isExtantCitations },
      { speakers, isExtant: isExtantSpeakers },
    ] = await Promise.all([
      isExtantMediaExcerpt
        ? this.readOrCreateUrlLocators(
            creator,
            mediaExcerpt.id,
            createUrlLocatorsWithUrl,
            createdAt
          ).then(({ urlLocators, isExtant }) => ({
            urlLocators: uniqBy(
              [...mediaExcerpt.locators.urlLocators, ...urlLocators],
              (ul) => ul.id
            ),
            isExtant,
          }))
        : { urlLocators: mediaExcerpt.locators.urlLocators, isExtant: false },
      isExtantMediaExcerpt
        ? this.readOrCreateMediaExcerptCitations(
            creator,
            mediaExcerpt.id,
            createCitationsWithSource,
            createdAt
          ).then(({ citations, isExtant }) => ({
            citations: uniqWith(
              [...mediaExcerpt.citations, ...citations],
              (c1, c2) =>
                c1.normalPincite === c2.normalPincite &&
                c1.source.id === c2.source.id
            ),
            isExtant,
          }))
        : { citations: mediaExcerpt.citations, isExtant: false },
      this.ensureMediaExcerptSpeakers(
        creator.id,
        mediaExcerpt.id,
        speakerPersorgs,
        createdAt
      ),
    ]);

    const isExtant =
      isExtantMediaExcerpt &&
      isExtantSources &&
      isExtantPersorgs &&
      isExtantUrlLocators &&
      isExtantCitations &&
      isExtantSpeakers;
    return {
      isExtant,
      mediaExcerpt: merge({}, mediaExcerpt, {
        locators: { urlLocators },
        citations,
        speakers: speakers,
      }),
    };
  }

  private async readOrCreateMediaExcerptWithRetry(
    createMediaExcerpt: CreateMediaExcerpt,
    userId: EntityId,
    createdAt: Moment,
    createUrlLocators: (CreateUrlLocator & { url: UrlOut })[],
    createCitations: (CreateMediaExcerptCitation & { source: SourceOut })[]
  ) {
    return retryTransaction(CREATE_MEDIA_EXCERPT_RETRIES, () =>
      this.mediaExcerptsDao.readOrCreateMediaExcerpt(
        createMediaExcerpt,
        userId,
        createdAt,
        createUrlLocators,
        createCitations
      )
    );
  }

  private async readOrCreateUrlLocators(
    creator: UserBlurb,
    mediaExcerptId: EntityId,
    urlLocators: (CreateUrlLocator & { url: UrlOut })[],
    created: Moment
  ) {
    const result = await Promise.all(
      urlLocators.map((u) =>
        this.readOrCreateUrlLocator(creator, mediaExcerptId, u, created)
      )
    );
    return {
      urlLocators: result.map((r) => r.urlLocator),
      isExtant: result.every((r) => r.isExtant),
    };
  }

  async createUrlLocators(
    userIdent: UserIdent,
    mediaExcerptId: EntityId,
    createUrlLocators: CreateUrlLocator[]
  ) {
    const creator = await this.authService.readUserBlurbForUserIdent(userIdent);
    const mediaExcerpt = await this.mediaExcerptsDao.readMediaExcerptForId(
      mediaExcerptId
    );
    if (!mediaExcerpt) {
      throw new EntityNotFoundError("MEDIA_EXCERPT", mediaExcerptId);
    }

    const createdAt = utcNow();
    const urls = await this.urlsService.readOrCreateUrlsAsUser(
      createUrlLocators.map((u) => u.url),
      creator.id,
      createdAt
    );
    const createUrlLocatorsWithUrl = zip(createUrlLocators, urls).map(
      ([createUrlLocator, url]) => {
        if (!createUrlLocator || !url) {
          throw newImpossibleError(
            `createUrlLocators and urls must match in length because urls is based off of createUrlLocators.`
          );
        }
        return {
          ...createUrlLocator,
          url,
        };
      }
    );
    return await this.readOrCreateUrlLocators(
      creator,
      mediaExcerptId,
      createUrlLocatorsWithUrl,
      createdAt
    );
  }

  private async readOrCreateUrlLocator(
    creator: UserBlurb,
    mediaExcerptId: EntityId,
    createUrlLocator: CreateUrlLocator & { url: UrlOut },
    created: Moment
  ) {
    const { isExtant, urlLocator } = await retryTransaction(
      CREATE_URL_LOCATOR_RETRIES,
      () =>
        this.mediaExcerptsDao.readOrCreateUrlLocator(
          mediaExcerptId,
          createUrlLocator,
          creator,
          created
        )
    );
    if (!isExtant) {
      await this.topicMessageSender.sendMessage({
        type: "AUTO_CONFIRM_URL_LOCATOR",
        params: {
          urlLocatorId: urlLocator.id,
        },
      });
    }
    return { isExtant, urlLocator };
  }

  private async readOrCreateMediaExcerptCitations(
    creator: UserBlurb,
    mediaExcerptId: EntityId,
    createCitations: (CreateMediaExcerptCitation & { source: SourceOut })[],
    created: Moment
  ): Promise<{ citations: MediaExcerptCitationOut[]; isExtant: boolean }> {
    const result = await Promise.all(
      createCitations.map((c) =>
        this.readOrCreateMediaExcerptCitation(
          creator,
          mediaExcerptId,
          c,
          created
        )
      )
    );
    const citations = result.map((r) => r.citation);
    const isExtant = result.every((r) => r.isExtant);
    return {
      citations,
      isExtant,
    };
  }

  private async readOrCreateMediaExcerptCitation(
    creator: UserBlurb,
    mediaExcerptId: EntityId,
    createCitation: CreateMediaExcerptCitation & { source: SourceOut },
    created: Moment
  ): Promise<{ citation: MediaExcerptCitationOut; isExtant: boolean }> {
    return retryTransaction(CREATE_CITATION_RETRIES, () =>
      this.mediaExcerptsDao.readOrCreateMediaExcerptCitation(
        mediaExcerptId,
        createCitation,
        creator,
        created
      )
    );
  }

  private async ensureMediaExcerptSpeakers(
    userId: EntityId,
    mediaExcerptId: EntityId,
    persorgs: PersorgOut[],
    created: Moment
  ) {
    const result = await Promise.all(
      persorgs.map((c) =>
        this.ensureMediaExcerptSpeaker(userId, mediaExcerptId, c, created)
      )
    );
    const isExtant = result.every((r) => r.isExtant);
    const speakers = result.map((r) => r.speaker);
    return {
      isExtant,
      speakers,
    };
  }

  private async ensureMediaExcerptSpeaker(
    userId: EntityId,
    mediaExcerptId: EntityId,
    persorg: PersorgOut,
    created: Moment
  ) {
    const equivalentSpeaker =
      await this.mediaExcerptsDao.readEquivalentMediaExcerptSpeaker(
        mediaExcerptId,
        persorg
      );
    if (equivalentSpeaker) {
      return {
        speaker: equivalentSpeaker,
        isExtant: true,
      };
    }
    const speaker = await this.mediaExcerptsDao.createMediaExcerptSpeaker(
      userId,
      mediaExcerptId,
      persorg,
      created
    );
    return { speaker, isExtant: false };
  }

  async readMediaExcerpts(
    filters: MediaExcerptSearchFilter | undefined,
    sorts: SortDescription[],
    continuationToken?: ContinuationToken,
    count = 25
  ) {
    if (!isFinite(count)) {
      throw new RequestValidationError(
        `count must be a number. ${count} is not ${typeof count}.`
      );
    }

    if (!continuationToken) {
      return this.readInitialMediaExcerpts(filters, sorts, count);
    }
    return this.readMoreMediaExcerpts(continuationToken, count);
  }

  async readInitialMediaExcerpts(
    filters: MediaExcerptSearchFilter | undefined,
    sorts: SortDescription[],
    count: number
  ) {
    const unambiguousSorts = concat(sorts, [
      { property: "id", direction: "ascending" },
    ]);
    const mediaExcerpts = await this.mediaExcerptsDao.readMediaExcerpts(
      filters,
      unambiguousSorts,
      count
    );

    const continuationToken = createContinuationToken(
      unambiguousSorts,
      mediaExcerpts,
      filters
    ) as ContinuationToken;
    return {
      mediaExcerpts,
      continuationToken,
    };
  }

  async readMoreMediaExcerpts(
    prevContinuationToken: ContinuationToken,
    count: number
  ) {
    const { filters, sorts } = decodeContinuationToken(prevContinuationToken);
    const mediaExcerpts = await this.mediaExcerptsDao.readMoreMediaExcerpts(
      filters,
      sorts,
      count
    );

    const continuationToken =
      (createNextContinuationToken(
        sorts,
        mediaExcerpts,
        filters
      ) as ContinuationToken) || prevContinuationToken;
    return {
      mediaExcerpts,
      continuationToken,
    };
  }

  async deleteMediaExcerpt(
    userIdent: UserIdent,
    mediaExcerptId: EntityId
  ): Promise<MediaExcerptOut> {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);
    const mediaExcerpt = await this.mediaExcerptsDao.readMediaExcerptForId(
      mediaExcerptId
    );
    if (!mediaExcerpt) {
      throw new EntityNotFoundError("MEDIA_EXCERPT", mediaExcerptId);
    }

    await this.checkModifyPermission(userId, mediaExcerpt);

    const deletedAt = utcNow();
    await this.mediaExcerptsDao.deleteMediaExcerpt(mediaExcerptId, deletedAt);
    return mediaExcerpt;
  }

  async deleteCitation(
    userIdent: UserIdent,
    deleteMediaExcerptCitation: DeleteMediaExcerptCitation
  ) {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);
    const mediaExcerpt = await this.mediaExcerptsDao.readMediaExcerptForId(
      deleteMediaExcerptCitation.mediaExcerptId
    );
    if (!mediaExcerpt) {
      throw new EntityNotFoundError(
        "MEDIA_EXCERPT",
        deleteMediaExcerptCitation.mediaExcerptId
      );
    }

    await this.checkModifyPermission(userId, mediaExcerpt);

    const deletedAt = utcNow();
    await this.mediaExcerptsDao.deleteMediaExcerptCitation(
      deleteMediaExcerptCitation,
      deletedAt
    );
  }

  async deleteUrlLocator(
    userIdent: UserIdent,
    mediaExcerptId: EntityId,
    urlLocatorId: EntityId
  ) {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);
    const mediaExcerpt = await this.mediaExcerptsDao.readMediaExcerptForId(
      mediaExcerptId
    );
    if (!mediaExcerpt) {
      throw new EntityNotFoundError("MEDIA_EXCERPT", mediaExcerptId);
    }

    await this.checkModifyPermission(userId, mediaExcerpt);

    const urlLocatorMediaExcerptId =
      await this.mediaExcerptsDao.readMediaExcerptIdForUrlLocatorId(
        urlLocatorId
      );
    if (!urlLocatorMediaExcerptId) {
      throw new EntityNotFoundError("URL_LOCATOR", urlLocatorId);
    }
    if (urlLocatorMediaExcerptId !== mediaExcerptId) {
      throw new RequestValidationError(
        `UrlLocator ${urlLocatorId} does not belong to MediaExcerpt ${mediaExcerptId}.`
      );
    }

    const deletedAt = utcNow();
    await this.mediaExcerptsDao.deleteUrlLocatorForId(urlLocatorId, deletedAt);
  }

  private async checkModifyPermission(
    userId: EntityId,
    mediaExcerpt: MediaExcerptOut
  ) {
    const hasEditPermission = await this.permissionsService.userHasPermission(
      userId,
      "EDIT_ANY_ENTITY"
    );
    if (hasEditPermission) {
      return;
    }

    if (mediaExcerpt.creatorUserId !== userId) {
      throw new AuthorizationError(
        makeModelErrors<MediaExcerptOut>((e) =>
          e("Only a Media Excerpt's creator may edit it.")
        )
      );
    }
    // TODO(473) disallow deletes if other users have already depended on it.
    if (
      utcNow().isAfter(
        momentAdd(mediaExcerpt.created, this.config.modifyEntityGracePeriod)
      )
    ) {
      throw new EntityTooOldToModifyError(this.config.modifyEntityGracePeriod);
    }
  }

  async readUrlLocatorForId(id: EntityId) {
    return await this.mediaExcerptsDao.readUrlLocatorForId(id);
  }

  async readMediaExcerptLocalRepForId(id: EntityId) {
    const justMediaExcerpt =
      await this.mediaExcerptsDao.readJustMediaExcerptForId(id);
    if (!justMediaExcerpt) {
      throw new EntityNotFoundError("MEDIA_EXCERPT", id);
    }
    return justMediaExcerpt.localRep;
  }

  updateTextFragmentUrlForUrlLocatorId(
    urlLocatorId: EntityId,
    textFragmentUrl: string
  ) {
    return this.mediaExcerptsDao.updateTextFragmentUrlForUrlLocatorId(
      urlLocatorId,
      textFragmentUrl
    );
  }
}
