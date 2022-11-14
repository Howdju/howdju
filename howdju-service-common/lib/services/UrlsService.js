const Promise = require("bluebird");
const filter = require("lodash/filter");
const map = require("lodash/map");

const { ActionTypes, ActionTargetTypes } = require("howdju-common");

exports.UrlsService = class UrlsService {
  constructor(actionsService, urlsDao) {
    this.actionsService = actionsService;
    this.urlsDao = urlsDao;
  }

  readOrCreateUrlsAsUser(urls, userId, now) {
    return Promise.resolve()
      .then(() => filter(urls, (url) => url.url))
      .then((nonEmptyUrls) =>
        Promise.all(
          map(nonEmptyUrls, (url) =>
            this.readOrCreateUrlAsUser(url, userId, now)
          )
        )
      );
  }

  readOrCreateUrlAsUser(url, userId, now) {
    return this.urlsDao
      .readUrlForUrl(url.url)
      .then((equivalentUrl) => {
        if (equivalentUrl) {
          return equivalentUrl;
        }
        return this.urlsDao.createUrl(url, userId, now);
      })
      .then((url) => {
        this.actionsService.asyncRecordAction(
          userId,
          now,
          ActionTypes.CREATE,
          ActionTargetTypes.URL,
          url.id
        );
        return url;
      });
  }
};
