import { concat, merge, zip } from "lodash";
import { Moment } from "moment";

import {
  ContinuationToken,
  CreateMediaExcerpt,
  CreateMediaExcerptCitation,
  CreateUrlLocator,
  EntityId,
  MediaExcerpt,
  MediaExcerptOut,
  MediaExcerptRef,
  newImpossibleError,
  PartialPersist,
  PersorgOut,
  SortDescription,
  utcNow,
} from "howdju-common";

import { AuthService } from "./AuthService";
import { SourcesService } from "./SourcesService";
import { CreateMediaExcerptDataIn, MediaExcerptsDao } from "../daos";
import { WritQuotesService } from "./WritQuotesService";
import { PersorgsService } from "./PersorgsService";
import { UrlsService } from "./UrlsService";
import { UserIdent } from "./types";
import { EntityNotFoundError, RequestValidationError } from "..";
import {
  createContinuationToken,
  createNextContinuationToken,
  decodeContinuationToken,
} from "./pagination";

export class MediaExcerptsService {
  authService: AuthService;
  mediaExcerptsDao: MediaExcerptsDao;
  writQuotesService: WritQuotesService;
  sourcesService: SourcesService;
  persorgsService: PersorgsService;
  urlsService: UrlsService;

  constructor(
    authService: AuthService,
    mediaExcerptsDao: MediaExcerptsDao,
    writQuotesService: WritQuotesService,
    sourcesService: SourcesService,
    persorgsService: PersorgsService,
    urlsService: UrlsService
  ) {
    this.authService = authService;
    this.mediaExcerptsDao = mediaExcerptsDao;
    this.writQuotesService = writQuotesService;
    this.sourcesService = sourcesService;
    this.persorgsService = persorgsService;
    this.urlsService = urlsService;
  }

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

    // Create the media excerpt
    const { mediaExcerpt, isExtant: isExtantMediaExcerpt } =
      await this.readOrCreateJustMediaExcerpt(userId, createMediaExcerpt, now);

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
    const [
      { urlLocators, isExtant: isExtantUrlLocators },
      { citations, isExtant: isExtantCitations },
      { isExtant: isExtantSpeakers },
    ] = await Promise.all([
      createMediaExcerpt.locators?.urlLocators
        ? this.readOrCreateUrlLocators(
            userId,
            mediaExcerpt,
            createUrlLocatorsWithUrl,
            now
          )
        : { urlLocators: [], isExtant: true },
      this.readOrCreateMediaExcerptCitations(
        userId,
        mediaExcerpt,
        createCitationsWithSource,
        now
      ),
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
    const urlLocator = await this.mediaExcerptsDao.createUrlLocator(
      creatorUserId,
      mediaExcerpt,
      createUrlLocator,
      created
    );
    return {
      urlLocator,
      isExtant: false,
    };
  }

  private async readOrCreateJustMediaExcerpt<
    T extends CreateMediaExcerptDataIn
  >(userId: EntityId, createMediaExcerpt: T, created: Moment) {
    const extantMediaExcerpt =
      await this.mediaExcerptsDao.readEquivalentMediaExcerpt(
        createMediaExcerpt
      );
    if (extantMediaExcerpt) {
      return {
        mediaExcerpt: extantMediaExcerpt,
        isExtant: true,
      };
    }
    const mediaExcerpt = await this.mediaExcerptsDao.createMediaExcerpt(
      createMediaExcerpt,
      userId,
      created
    );
    return {
      mediaExcerpt,
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
    userId: EntityId,
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
    const citation = await this.mediaExcerptsDao.createMediaExcerptCitation(
      userId,
      mediaExcerpt,
      createCitation,
      created
    );
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
      return this.readInitialMediaExcerpts(sorts, count);
    }
    return this.readMoreMediaExcerpts(continuationToken, count);
  }

  async readInitialMediaExcerpts(sorts: SortDescription[], count: number) {
    const unambiguousSorts = concat(sorts, [
      { property: "id", direction: "ascending" },
    ]);
    const mediaExcerpts = await this.mediaExcerptsDao.readMediaExcerpts(
      unambiguousSorts,
      count
    );

    const continuationToken = createContinuationToken(
      unambiguousSorts,
      mediaExcerpts
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
    const { sorts, filters } = decodeContinuationToken(prevContinuationToken);
    const mediaExcerpts = await this.mediaExcerptsDao.readMoreMediaExcerpts(
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
