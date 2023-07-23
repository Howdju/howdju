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
  MediaExcerpt,
  MediaExcerptCitationOut,
  MediaExcerptOut,
  MediaExcerptRef,
  MediaExcerptSearchFilter,
  momentAdd,
  newImpossibleError,
  PartialPersist,
  PersorgOut,
  SortDescription,
  SourceOut,
  UrlLocatorOut,
  UrlOut,
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
import { retryTransaction } from "./patterns";

// Must be greater than the number MediaExcerpts targeting the same URL or Source that we want
// to succeed creating in parallel.
const CREATE_MEDIA_EXCERPT_RETRIES = 10;
const CREATE_URL_LOCATOR_RETRIES = 3;
const CREATE_CITATION_RETRIES = 3;
export class MediaExcerptsService {
  constructor(
    private config: ApiConfig,
    private authService: AuthService,
    private permissionsService: PermissionsService,
    private mediaExcerptsDao: MediaExcerptsDao,
    private sourcesService: SourcesService,
    private persorgsService: PersorgsService,
    private urlsService: UrlsService
  ) {}

  async readMediaExcerptForId(id: EntityId): Promise<MediaExcerptOut> {
    const mediaExcerpt = await this.mediaExcerptsDao.readMediaExcerptForId(id);
    if (!mediaExcerpt) {
      throw new EntityNotFoundError("MEDIA_EXCERPT", id);
    }
    return mediaExcerpt;
  }

  async readOrCreateMediaExcerpt(
    userIdent: UserIdent,
    createMediaExcerpt: CreateMediaExcerpt
  ): Promise<{ isExtant: boolean; mediaExcerpt: MediaExcerptOut }> {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);
    const createdAt = utcNow();
    const createCitations = createMediaExcerpt.citations ?? [];

    // Create entities that don't depend on the media excerpt's ID
    const createUrls = createMediaExcerpt.locators?.urlLocators.map(
      (u) => u.url
    );
    const [
      { sources, isExtant: isExtantSources },
      { persorgs: speakers, isExtant: isExtantPersorgs },
      urls,
    ] = await Promise.all([
      this.sourcesService.readOrCreateSources(
        userId,
        createCitations.map((c) => c.source),
        createdAt
      ),
      createMediaExcerpt.speakers
        ? this.persorgsService.readOrCreatePersorgs(
            userId,
            createMediaExcerpt.speakers,
            createdAt
          )
        : { persorgs: [], isExtant: true },
      createUrls
        ? this.urlsService.readOrCreateUrlsAsUser(createUrls, userId, createdAt)
        : [],
    ]);

    // Create entities that depend on the media excerpt's ID
    const createUrlLocatorsWithUrl = zip(
      createMediaExcerpt.locators?.urlLocators,
      urls
    ).map(([urlLocator, url]) => ({
      ...urlLocator,
      url: url,
    }));
    const createCitationsWithSource = zip(createCitations, sources).map(
      ([createCitation, source]) => {
        if (!createCitation) {
          throw newImpossibleError(
            `createCitation was undefined while zipping with sources even though they should have the same length.`
          );
        }
        if (!source) {
          throw newImpossibleError(
            `source was undefined while zipping with createCitations even though they should have the same length.`
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
        userId,
        createdAt,
        createUrlLocatorsWithUrl,
        createCitationsWithSource
      );

    const [
      { urlLocators, isExtant: isExtantUrlLocators },
      { citations, isExtant: isExtantCitations },
      { isExtant: isExtantSpeakers },
    ] = await Promise.all([
      isExtantMediaExcerpt
        ? this.readOrCreateUrlLocators(
            userId,
            mediaExcerpt,
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
            userId,
            mediaExcerpt,
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
        userId,
        mediaExcerpt,
        speakers,
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
        speakers,
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
    creatorUserId: EntityId,
    mediaExcerpt: MediaExcerptRef,
    urlLocators: PartialPersist<CreateUrlLocator, "url">[],
    created: Moment
  ) {
    const result = await Promise.all(
      urlLocators.map((u) =>
        this.readOrCreateUrlLocator(creatorUserId, mediaExcerpt, u, created)
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
    const userId = await this.authService.readUserIdForUserIdent(userIdent);
    const mediaExcerpt = await this.mediaExcerptsDao.readMediaExcerptForId(
      mediaExcerptId
    );
    if (!mediaExcerpt) {
      throw new EntityNotFoundError("MEDIA_EXCERPT", mediaExcerptId);
    }

    await this.checkModifyPermission(userId, mediaExcerpt);

    const createdAt = utcNow();
    const urls = await this.urlsService.readOrCreateUrlsAsUser(
      createUrlLocators.map((u) => u.url),
      userId,
      createdAt
    );
    const createUrlLocatorsWithUrl = zip(createUrlLocators, urls).map(
      ([createUrlLocator, url]) => ({
        ...createUrlLocator,
        url,
      })
    );
    return await this.readOrCreateUrlLocators(
      userId,
      mediaExcerpt,
      createUrlLocatorsWithUrl,
      createdAt
    );
  }

  private async readOrCreateUrlLocator(
    creatorUserId: EntityId,
    mediaExcerpt: MediaExcerptRef,
    createUrlLocator: PartialPersist<CreateUrlLocator, "url">,
    created: Moment
  ) {
    return retryTransaction(CREATE_URL_LOCATOR_RETRIES, () =>
      this.mediaExcerptsDao.readOrCreateUrlLocator(
        mediaExcerpt,
        createUrlLocator,
        creatorUserId,
        created
      )
    );
  }

  private async readOrCreateMediaExcerptCitations(
    userId: EntityId,
    mediaExcerpt: MediaExcerptOut,
    createCitations: PartialPersist<CreateMediaExcerptCitation, "source">[],
    created: Moment
  ): Promise<{ citations: MediaExcerptCitationOut[]; isExtant: boolean }> {
    const result = await Promise.all(
      createCitations.map((c) =>
        this.readOrCreateMediaExcerptCitation(userId, mediaExcerpt, c, created)
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
    creatorUserId: EntityId,
    mediaExcerpt: MediaExcerptOut,
    createCitation: PartialPersist<CreateMediaExcerptCitation, "source">,
    created: Moment
  ): Promise<{ citation: MediaExcerptCitationOut; isExtant: boolean }> {
    return retryTransaction(CREATE_CITATION_RETRIES, () =>
      this.mediaExcerptsDao.readOrCreateMediaExcerptCitation(
        mediaExcerpt,
        createCitation,
        creatorUserId,
        created
      )
    );
  }

  private async ensureMediaExcerptSpeakers(
    userId: EntityId,
    mediaExcerpt: MediaExcerptOut,
    persorgs: PersorgOut[],
    created: Moment
  ) {
    const result = await Promise.all(
      persorgs.map((c) =>
        this.ensureMediaExcerptSpeaker(userId, mediaExcerpt, c, created)
      )
    );
    const isExtant = result.every((r) => r.isExtant);
    return {
      isExtant,
    };
  }

  private async ensureMediaExcerptSpeaker(
    userId: EntityId,
    mediaExcerpt: MediaExcerpt,
    persorg: PersorgOut,
    created: Moment
  ) {
    const hasEquivalent =
      await this.mediaExcerptsDao.hasEquivalentMediaExcerptSpeaker(
        mediaExcerpt,
        persorg
      );
    if (hasEquivalent) {
      return {
        isExtant: true,
      };
    }
    await this.mediaExcerptsDao.createMediaExcerptSpeaker(
      userId,
      mediaExcerpt,
      persorg,
      created
    );
    return { isExtant: false };
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

  async deleteUrlLocator(userIdent: UserIdent, urlLocator: UrlLocatorOut) {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);
    const mediaExcerpt = await this.mediaExcerptsDao.readMediaExcerptForId(
      urlLocator.mediaExcerptId
    );
    if (!mediaExcerpt) {
      throw new EntityNotFoundError("MEDIA_EXCERPT", urlLocator.mediaExcerptId);
    }

    await this.checkModifyPermission(userId, mediaExcerpt);

    const deletedAt = utcNow();
    await this.mediaExcerptsDao.deleteUrlLocatorForId(urlLocator.id, deletedAt);
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
}
