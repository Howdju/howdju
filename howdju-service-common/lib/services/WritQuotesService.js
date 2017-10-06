const Promise = require('bluebird')

const assign = require('lodash/assign')
const concat = require('lodash/concat')
const differenceBy = require('lodash/differenceBy')
const forEach = require('lodash/forEach')
const groupBy = require('lodash/groupBy')
const keys = require('lodash/keys')
const map = require('lodash/map')
const merge = require('lodash/merge')
const pickBy = require('lodash/pickBy')
const sortBy = require('lodash/sortBy')
const toNumber = require('lodash/toNumber')
const values = require('lodash/values')

const {
  ActionTargetType,
  ActionSubjectType,
  ActionType,
  SortDirection,
  entityConflictCodes,
  userActionsConflictCodes,
} = require('howdju-common')

const {
  WritQuoteValidator
} = require('../validators')
const {
  createContinuationToken,
  decodeContinuationToken,
  createNextContinuationToken,
} = require('./pagination')
const {
  permissions,
} = require("../permissions")
const {
  EntityConflictError,
  EntityValidationError,
  RequestValidationError,
  UserActionsConflictError,
} = require('../serviceErrors')

exports.WritQuotesService = class WritQuotesService {
  constructor(
    logger,
    writQuoteValidator,
    actionsService,
    authService,
    writsService,
    urlsService,
    writQuotesDao,
    writsDao,
    permissionsDao
  ) {
    this.logger = logger
    this.writQuoteValidator = writQuoteValidator
    this.actionsService = actionsService
    this.authService = authService
    this.writsService = writsService
    this.urlsService = urlsService
    this.writQuotesDao = writQuotesDao
    this.writsDao = writsDao
    this.permissionsDao = permissionsDao
  }

  readWritQuoteForId(writQuoteId, {authToken}) {
    return this.writQuotesDao.readWritQuoteForId(writQuoteId)
  }

  readWritQuotes({sorts, continuationToken, count = 25 }) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }

    if (!continuationToken) {
      return this.readInitialWritQuotes(sorts, countNumber)
    }
    return this.readMoreWritQuotes(continuationToken, countNumber)
  }

  readInitialWritQuotes(requestedSorts, count) {
    const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
    return this.writQuotesDao.readWritQuotes(unambiguousSorts, count)
      .then(writQuotes => {
        const continuationToken = createContinuationToken(unambiguousSorts, writQuotes)
        return {
          writQuotes,
          continuationToken,
        }
      })
  }

  readMoreWritQuotes(continuationToken, count) {
    const {
      sorts,
      filters,
    } = decodeContinuationToken(continuationToken)
    return this.writQuotesDao.readMoreWritQuotes(sorts, count)
      .then(writQuotes => {
        const nextContinuationToken = createNextContinuationToken(sorts, writQuotes, filters) || continuationToken
        return {
          writQuotes,
          continuationToken: nextContinuationToken
        }
      })
  }

  readWritQuotesHavingUrlContainingText(text) {
    return this.writQuotesDao.readWritQuotesHavingUrlContainingText(text)
  }

  updateWritQuote({authToken, writQuote}) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const validationErrors = this.writQuoteValidator.validate(writQuote)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError({writQuote: validationErrors})
        }
        return userId
      })
      .then(userId => Promise.all([
        userId,
        this.writQuotesDao.hasWritQuoteChanged(writQuote),
        this.writsDao.hasWritChanged(writQuote.writ),
        diffUrls(this.writQuotesDao, writQuote),
      ]))
      .then( ([
        userId,
        writQuoteHasChanged,
        writHasChanged,
        urlDiffs,
      ]) => {
        if (!writQuoteHasChanged && !writHasChanged && !urlDiffs.haveChanged) {
          return writQuote
        }

        const entityConflicts = {}
        const userActionConflicts = {}
        if (writQuoteHasChanged) {
          entityConflicts[entityConflictCodes.ANOTHER_WRIT_QUOTE_HAS_SAME_TEXT] =
            this.writQuotesDao.hasEquivalentWritQuotes(writQuote)
          assign(userActionConflicts, {
            [userActionsConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_BASED_ON_THIS_WRIT_QUOTE]:
              this.writQuotesDao.isBasisToJustificationsHavingOtherUsersVotes(userId, writQuote),
            [userActionsConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_WRIT_QUOTE]:
              this.writQuotesDao.isBasisToOtherUsersJustifications(userId, writQuote),
            [userActionsConflictCodes.OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_WRIT_QUOTE]:
              this.writQuotesDao.isBasisToJustificationsHavingOtherUsersCounters(userId, writQuote),
          })
        }
        if (writHasChanged) {
          const writ = writQuote.writ

          entityConflicts[entityConflictCodes.ANOTHER_WRIT_HAS_EQUIVALENT_TITLE] =
            this.writsDao.hasEquivalentWrits(writ)

          assign(userActionConflicts, {
            [userActionsConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_BASED_ON_THIS_WRIT]:
              this.writsDao.isWritOfBasisToOtherUsersJustifications(userId, writ),
            [userActionsConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_WRIT]:
              this.writsDao.isWritOfBasisToJustificationsHavingOtherUsersVotes(userId, writ),
            [userActionsConflictCodes.OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_WRIT]:
              this.writsDao.isWritOfBasisToJustificationsHavingOtherUsersCounters(userId, writ),
          })
        }
        if (urlDiffs.haveChanged) {
          // When URLs are votable, ensure that no one has voted them (or at least up-voted them) before deleting
          // Adding should always be okay
        }

        return Promise.props({
          userId,
          now: new Date(),
          writQuoteHasChanged,
          writHasChanged,
          urlDiffs,
          hasPermission: this.permissionsDao.userHasPermission(userId, permissions.EDIT_ANY_ENTITY),
          entityConflicts: Promise.props(entityConflicts),
          userActionConflicts: Promise.props(userActionConflicts)
        })
      })
      .then( ({
        userId,
        now,
        hasPermission,
        entityConflicts,
        userActionConflicts,
        writQuoteHasChanged,
        writHasChanged,
        urlDiffs,
      }) => {

        const entityConflictCodes = keys(pickBy(entityConflicts))
        if (entityConflictCodes.length > 0) {
          throw new EntityConflictError(merge(
            WritQuoteValidator.blankErrors(),
            {
              hasErrors: true,
              modelErrors: entityConflictCodes,
            }
          ))
        }

        const userActionsConflictCodes = keys(pickBy(userActionConflicts))
        if (userActionsConflictCodes.length > 0) {
          if (!hasPermission) {
            throw new UserActionsConflictError(merge(
              WritQuoteValidator.blankErrors(),
              {
                hasErrors: true,
                modelErrors: userActionsConflictCodes,
              }
            ))
          }
          this.logger.info(`User ${userId} overriding userActionsConflictCodes ${userActionsConflictCodes}`)
        }

        return {userId, now, writQuoteHasChanged, writHasChanged, urlDiffs}
      })
      .then( ({userId, now, writQuoteHasChanged, writHasChanged, urlDiffs}) => Promise.all([
        userId,
        now,
        writQuoteHasChanged ?
          this.writQuotesDao.updateWritQuote(writQuote) :
          writQuote,
        writHasChanged ?
          this.writsService.updateWritAsUser(userId, writQuote.writ, now) :
          writQuote.writ,
        urlDiffs.haveChanged ?
          this.updateWritQuoteUrlsAsUser(writQuote, urlDiffs, userId, now) :
          writQuote.urls,
        writQuoteHasChanged,
        writHasChanged,
        urlDiffs.haveChanged,
      ]))
      .then( ([
        userId,
        now,
        writQuote,
        writ,
        urls,
        writQuoteHasChanged,
      ]) => {
        if (writQuoteHasChanged) {
          this.actionsService.asyncRecordAction(userId, now, ActionType.UPDATE, ActionTargetType.WRIT_QUOTE,
            writQuote.id)
        }
        return [writQuote, writ, urls]
      })
      .then( ([writQuote, writ, urls]) => {
        if (writQuote.writ !== writ) {
          writQuote = assign({}, writQuote, {writ})
        }
        if (writQuote.urls !== urls) {
          writQuote = assign({}, writQuote, {urls})
        }

        return writQuote
      })
  }

  updateWritQuoteUrlsAsUser(writQuote, urlDiffs, userId, now) {
    return Promise.resolve()
      .then(() => {
        // deduplicate URLs, giving preference to those having IDs
        const urlByUrl = {}
        forEach(writQuote.urls, url => {
          const previousUrl = urlByUrl[url.url]
          if (!previousUrl || !previousUrl.id) {
            urlByUrl[url.url] = url
          }
        })
        return values(urlByUrl)
      })
      .then(dedupedUrls => groupBy(dedupedUrls, u => u.id ? 'hasId' : 'noId'))
      .then( ({hasId: extantUrls, noId: newUrls}) => Promise.all([
        extantUrls || [],
        newUrls ? this.urlsService.readOrCreateUrlsAsUser(newUrls, userId, now) : [],
      ]))
      .then( ([extantUrls, createdUrls]) => extantUrls.concat(createdUrls) )
      .then( updatedUrls => Promise.all([
        this.writQuotesDao.readUrlsByWritQuoteId(writQuote.id),
        updatedUrls,
      ]))
      .then( ([currentUrls, updatedUrls]) => ({
        updatedUrls,
        addedUrls: differenceBy(updatedUrls, currentUrls, url => url.url),
        removedUrls: differenceBy(currentUrls, updatedUrls, url => url.url),
      }))
      .then( ({updatedUrls, addedUrls, removedUrls}) => Promise.all([
        updatedUrls,
        addedUrls.length > 0 ? this.writQuotesDao.createWritQuoteUrls(writQuote, addedUrls, userId, now) : addedUrls,
        removedUrls.length > 0 ? this.writQuotesDao.deleteWritQuoteUrls(writQuote, removedUrls, now) : removedUrls,
      ]))
      .then( ([updatedUrls, createdWritQuoteUrls, deletedWritQuoteUrls]) => {
        map(createdWritQuoteUrls, writQuoteUrl =>
          this.actionsService.asyncRecordAction(userId, now, ActionType.ASSOCIATE, ActionTargetType.WRIT_QUOTE,
            writQuoteUrl.writQuoteId, ActionSubjectType.URL, writQuoteUrl.urlId))
        map(deletedWritQuoteUrls, writQuoteUrl =>
          this.actionsService.asyncRecordAction(userId, now, ActionType.DISASSOCIATE,
            ActionTargetType.WRIT_QUOTE, writQuoteUrl.writQuoteId, ActionSubjectType.URL,
            writQuoteUrl.urlId))
        return updatedUrls
      })
      .then(updatedUrls => sortBy(updatedUrls, url => url.url))
  }

  readOrCreateWritQuoteAsUser(writQuote, userId, now) {
    return Promise.resolve()
      .then(() => {
        const validationErrors = this.writQuoteValidator.validate(writQuote)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(validationErrors)
        }
        return userId
      })
      .then(userId => this.readOrCreateValidWritQuoteAsUser(writQuote, userId, now))
  }

  readOrCreateValidWritQuoteAsUser(writQuote, userId, now) {
    return Promise.resolve()
      .then(() => {
        if (writQuote.id) {
          return Promise.props({
            isExtant: true,
            writQuote: this.readWritQuoteForId(writQuote.id)
          })
        }

        return readOrCreateEquivalentValidWritQuoteAsUser(this, writQuote, userId, now)
      })
  }
}

function readOrCreateEquivalentValidWritQuoteAsUser(service, writQuote, userId, now) {
  return Promise.all([
    service.writsService.readOrCreateValidWritAsUser(writQuote.writ, userId, now),
    service.urlsService.readOrCreateUrlsAsUser(writQuote.urls, userId, now),
  ])
    .then( ([{writ}, urls]) => {
      writQuote.writ.id = writ.id
      return Promise.all([
        writ,
        urls,
        readOrCreateJustWritQuoteAsUser(service, writQuote, userId, now)
      ])
    })
    .then( ([writ, urls, {isExtant, writQuote}]) => {
      writQuote.writ = writ
      writQuote.urls = urls
      return Promise.all([
        isExtant,
        writQuote,
        createWritQuoteUrlsAsUser(service, writQuote, userId, now)
      ])
    })
    .then( ([isExtant, writQuote]) => ({isExtant, writQuote}))
}

function readOrCreateJustWritQuoteAsUser(service, writQuote, userId, now) {
  return service.writQuotesDao.readWritQuoteHavingWritIdAndQuoteText(writQuote.writ.id, writQuote.quoteText)
    .then(equivalentWritQuote => Promise.all([
      !!equivalentWritQuote,
      equivalentWritQuote || service.writQuotesDao.createWritQuote(writQuote, userId, now)
    ]))
    .then( ([isExtant, writQuote]) => {
      const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
      service.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetType.WRIT_QUOTE, writQuote.id)
      return {
        isExtant,
        writQuote,
      }
    })
}

function createWritQuoteUrlsAsUser(service, writQuote, userId, now) {
  return service.writQuotesDao.readWritQuoteUrlsForWritQuote(writQuote)
    .then(extantWritQuoteUrls => {
      const extantWritQuoteUrlsByUrlId = {}
      forEach(extantWritQuoteUrls, extantWritQuoteUrl => {
        extantWritQuoteUrlsByUrlId[extantWritQuoteUrl.urlId] = extantWritQuoteUrl
      })

      return map(writQuote.urls, url => extantWritQuoteUrlsByUrlId[url.id] ?
        extantWritQuoteUrlsByUrlId[url.id] :
        service.writQuotesDao.createWritQuoteUrl(writQuote, url, userId, now)
          .then( (writQuoteUrl) => service.actionsService.asyncRecordAction(userId, now, ActionType.ASSOCIATE, ActionTargetType.WRIT_QUOTE,
            writQuoteUrl.writQuoteId, ActionSubjectType.URL, writQuoteUrl.urlId))
      )
    })
}

function diffUrls(writQuotesDao, writQuote) {
  return Promise.resolve()
    .then(() => writQuotesDao.readUrlsByWritQuoteId(writQuote.id))
    .then(extantUrls => {
      const addedUrls = differenceBy(writQuote.urls, [extantUrls], url => url.url)
      const removedUrls = differenceBy(extantUrls, [writQuote.urls], url => url.url)
      const haveChanged = addedUrls.length > 0 || removedUrls.length > 0
      return {
        addedUrls,
        removedUrls,
        haveChanged
      }
    })
}