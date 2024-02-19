import { Moment } from "moment";
import crypto from "crypto";

import {
  CreateUrl,
  EntityId,
  Logger,
  normalizeUrl,
  TopicMessageSender,
  UrlOut,
} from "howdju-common";

import { CanonicalUrlsService } from "./CanonicalUrlsService";
import { UrlsDao } from "../daos";
import { ensurePresent, readWriteReread } from "./patterns";
import { EntityNotFoundError } from "..";

export class UrlsService {
  constructor(
    private readonly logger: Logger,
    private readonly canonicalUrlsService: CanonicalUrlsService,
    private readonly urlsDao: UrlsDao,
    private readonly topicMessageSender: TopicMessageSender
  ) {}

  async readOrCreateUrlsAsUser(
    urls: CreateUrl[],
    userId: EntityId,
    created: Moment
  ) {
    const nonEmptyUrls = urls.filter((url) => url.url);
    return await Promise.all(
      nonEmptyUrls.map((url) =>
        this.readOrCreateUrlAsUser(url, userId, created)
      )
    );
  }

  async readOrCreateUrlAsUser(
    createUrl: CreateUrl,
    userId: EntityId,
    now: Moment
  ): Promise<UrlOut> {
    const url = normalizeUrl(createUrl.url);
    const { entity: urlOut, isExtant } = await readWriteReread(
      () => this.urlsDao.readUrlForUrl(url),
      () => this.urlsDao.createUrl({ ...createUrl, url }, userId, now)
    );
    if (!isExtant) {
      await this.topicMessageSender.sendMessage({
        type: "CONFIRM_CANONICAL_URL",
        params: {
          urlId: urlOut.id,
        },
      });
    }
    return urlOut;
  }

  /** Confirm a URL's canonical URL. */
  async confirmCanonicalUrl(urlId: EntityId) {
    const url = await this.urlsDao.readUrlForId(urlId);
    if (!url) {
      throw new EntityNotFoundError("URL", urlId);
    }

    const canonicalUrl =
      await this.canonicalUrlsService.readOrFetchCanonicalUrl(url.url);
    if (canonicalUrl === url.canonicalUrl) {
      this.logger.info(
        `Url's (${url.id}) canonical URL already matched the read one: ${canonicalUrl}.`
      );
      return;
    }

    this.logger.info(
      `Url ${urlId} has a new canonical URL: ${canonicalUrl} (previously: ${url.canonicalUrl}).`
    );
    await this.urlsDao.setCanonicalUrlForId(urlId, canonicalUrl);
  }

  async readUrlsForIds(urlIds: EntityId[]) {
    const urls = await this.urlsDao.readUrlsForIds(urlIds);
    ensurePresent(urlIds, urls, "URL");
    return urls;
  }

  async readAllDomains() {
    const allDomains = await this.urlsDao.readAllDomains();
    return allDomains.map((domain) => {
      // Create an artificial ID to help the client track the domain (normalizr only handles
      // objects, not strings.)
      const shaHasher = crypto.createHash("sha1");
      shaHasher.update(domain);
      const id = shaHasher.digest("hex");
      return { id, domain };
    });
  }
}
