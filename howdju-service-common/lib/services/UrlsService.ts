import {
  ActionTypes,
  ActionTargetTypes,
  CreateUrl,
  EntityId,
} from "howdju-common";
import { ActionsService } from "./ActionsService";
import { UrlsDao } from "../daos";
import { Moment } from "moment";

export class UrlsService {
  private actionsService: ActionsService;
  private urlsDao: UrlsDao;

  constructor(actionsService: ActionsService, urlsDao: UrlsDao) {
    this.actionsService = actionsService;
    this.urlsDao = urlsDao;
  }

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
    const equivalentUrl = await this.urlsDao.readUrlForUrl(createUrl.url);
    if (equivalentUrl) {
      return equivalentUrl;
    }
    const url = await this.urlsDao.createUrl(createUrl, userId, now);

    this.actionsService.asyncRecordAction(
      userId,
      now,
      ActionTypes.CREATE,
      ActionTargetTypes.URL,
      url.id
    );
    return url;
  }
}
