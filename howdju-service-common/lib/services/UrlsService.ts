import { CreateUrl, EntityId } from "howdju-common";
import { UrlsDao } from "../daos";
import { Moment } from "moment";
import { readWriteReread } from "./patterns";

export class UrlsService {
  constructor(private urlsDao: UrlsDao) {}

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
  ) {
    const { entity: url } = await readWriteReread(
      () => this.urlsDao.readUrlForUrl(createUrl.url),
      () => this.urlsDao.createUrl(createUrl, userId, now)
    );
    return url;
  }
}
