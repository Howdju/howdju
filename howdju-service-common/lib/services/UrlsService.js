const Promise = require('bluebird')
const filter = require('lodash/filter')
const map = require('lodash/map')

const {
  ActionType,
  ActionTargetType,
} = require('howdju-common')


exports.UrlsService = class UrlsService {

  constructor(actionsService, urlsDao) {
    this.actionsService = actionsService
    this.urlsDao = urlsDao
  }

  createUrlsAsUser(urls, userId, now) {
    return Promise.resolve()
      .then(() => filter(urls, url => url.url))
      .then(nonEmptyUrls => Promise.all(map(nonEmptyUrls, url => this.createUrlAsUser(url, userId, now))))
  }

  createUrlAsUser(url, userId, now) {
    return this.urlsDao.readUrlEquivalentTo(url)
      .then( equivalentUrl => {
        if (equivalentUrl) {
          return equivalentUrl
        }
        return this.urlsDao.createUrl(url, userId, now)
          .then( (url) => {
            this.actionsService.asyncRecordAction(userId, now, ActionType.CREATE, ActionTargetType.URL, url.id)
            return url
          })
      })
  }
}
