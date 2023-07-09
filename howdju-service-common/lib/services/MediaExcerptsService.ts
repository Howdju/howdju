import { concat, merge, zip } from "lodash";
import { Moment } from "moment";
import { DatabaseError } from "pg";

import {
  ContinuationToken,
  CreateMediaExcerpt,
  CreateMediaExcerptCitation,
  CreateUrlLocator,
  EntityId,
  Logger,
  MediaExcerpt,
  MediaExcerptOut,
  MediaExcerptRef,
  MediaExcerptSearchFilter,
  newImpossibleError,
  PartialPersist,
  PersorgOut,
  sleep,
  SortDescription,
  SourceOut,
  UrlOut,
  utcNow,
} from "howdju-common";

import { AuthService } from "./AuthService";
import { SourcesService } from "./SourcesService";
import { MediaExcerptsDao } from "../daos";
import { PersorgsService } from "./PersorgsService";
import { UrlsService } from "./UrlsService";
import { UserIdent } from "./types";
import { EntityNotFoundError, RequestValidationError } from "..";
import {
  createContinuationToken,
  createNextContinuationToken,
  decodeContinuationToken,
} from "./pagination";

const MAX_SUPPORTED_CONCURRENT_EQUIVALENT_MEDIA_EXCERPT_CREATIONS = 12;
export class MediaExcerptsService {
  constructor(
    private logger: Logger,
    private authService: AuthService,
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
    const now = utcNow();
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
        now
      ),
      createMediaExcerpt.speakers
        ? this.persorgsService.readOrCreatePersorgs(
            userId,
            createMediaExcerpt.speakers,
            now
          )
        : { persorgs: [], isExtant: true },
      createUrls
        ? this.urlsService.readOrCreateUrlsAsUser(createUrls, userId, now)
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
        now,
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
            now
          )
        : { urlLocators: mediaExcerpt.locators.urlLocators, isExtant: false },
      isExtantMediaExcerpt
        ? this.readOrCreateMediaExcerptCitations(
            userId,
            mediaExcerpt,
            createCitationsWithSource,
            now
          )
        : { citations: mediaExcerpt.citations, isExtant: false },
      this.ensureMediaExcerptSpeakers(userId, mediaExcerpt, speakers, now),
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
    created: Moment,
    createUrlLocators: (CreateUrlLocator & { url: UrlOut })[],
    createCitations: (CreateMediaExcerptCitation & { source: SourceOut })[]
  ) {
    // Must be greater than the number MediaExcerpts targeting the same URL or Source that we want
    // to succeed creating in parallel.
    const maxAttempts =
      MAX_SUPPORTED_CONCURRENT_EQUIVALENT_MEDIA_EXCERPT_CREATIONS;
    let attempt = 1;
    while (attempt <= maxAttempts) {
      try {
        return await this.mediaExcerptsDao.readOrCreateMediaExcerpt(
          createMediaExcerpt,
          userId,
          created,
          createUrlLocators,
          createCitations
        );
      } catch (e) {
        if (
          !(e instanceof DatabaseError) ||
          e.message !==
            "could not serialize access due to read/write dependencies among transactions"
        ) {
          throw e;
        }
        const sleepMs = Math.random() * 10;
        this.logger.info(
          `Failed to readOrCreate MediaExcerpt (attempt ${attempt}/${maxAttempts}; sleeping ${sleepMs}): ${e.message})`
        );
        // Sleep a short random amount of time to avoid repeated conflicts with other transactions
        await sleep(sleepMs);
        attempt++;
      }
    }
    throw new Error(
      `Failed to create media excerpt after ${maxAttempts} attempts.`
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

  private async readOrCreateUrlLocator(
    creatorUserId: EntityId,
    mediaExcerpt: MediaExcerptRef,
    createUrlLocator: CreateUrlLocator,
    created: Moment
  ) {
    const extantUrlLocator =
      await this.mediaExcerptsDao.readEquivalentUrlLocator(
        mediaExcerpt,
        createUrlLocator
      );
    if (extantUrlLocator) {
      return {
        urlLocator: extantUrlLocator,
        isExtant: true,
      };
    }
    const urlLocator = await this.mediaExcerptsDao.createUrlLocator({
      creatorUserId,
      mediaExcerpt,
      createUrlLocator,
      created,
    });
    return {
      urlLocator,
      isExtant: false,
    };
  }

  private async readOrCreateMediaExcerptCitations(
    userId: EntityId,
    mediaExcerpt: MediaExcerptOut,
    createCitations: PartialPersist<CreateMediaExcerptCitation, "source">[],
    created: Moment
  ) {
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
    createCitation: CreateMediaExcerptCitation,
    created: Moment
  ) {
    const extantCitation =
      await this.mediaExcerptsDao.readEquivalentMediaExcerptCitation(
        mediaExcerpt,
        createCitation
      );
    if (extantCitation) {
      return {
        citation: extantCitation,
        isExtant: true,
      };
    }
    const citation = await this.mediaExcerptsDao.createMediaExcerptCitation({
      creatorUserId,
      mediaExcerpt,
      createCitation,
      created,
    });
    return { citation, isExtant: false };
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
}
