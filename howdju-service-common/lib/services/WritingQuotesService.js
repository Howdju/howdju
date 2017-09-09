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
  userActionConflictCodes,
} = require('howdju-common')

const {
  WritingQuoteValidator
} = require('../validators')
const {
  createSorts,
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

const diffUrls = (writingQuotesDao, writingQuote) => Promise.resolve()
  .then(() => writingQuotesDao.readUrlsByWritingQuoteId(writingQuote.id))
  .then(extantUrls => {
    const addedUrls = differenceBy(writingQuote.urls, [extantUrls], url => url.url)
    const removedUrls = differenceBy(extantUrls, [writingQuote.urls], url => url.url)
    const haveChanged = addedUrls.length > 0 || removedUrls.length > 0
    return {
      addedUrls,
      removedUrls,
      haveChanged
    }
  })

exports.WritingQuotesService = class WritingQuotesService {
  constructor(
    logger,
    writingQuoteValidator,
    actionsService,
    authService,
    writingsService,
    urlsService,
    writingQuotesDao,
    writingsDao,
    permissionsDao
  ) {
    this.logger = logger
    this.writingQuoteValidator = writingQuoteValidator
    this.actionsService = actionsService
    this.authService = authService
    this.writingsService = writingsService
    this.urlsService = urlsService
    this.writingQuotesDao = writingQuotesDao
    this.writingsDao = writingsDao
    this.permissionsDao = permissionsDao
  }

  readWritingQuote(writingQuoteId) {
    return this.writingQuotesDao.read(writingQuoteId)
  }

  readWritingQuotes({continuationToken, sortProperty = 'created', sortDirection = SortDirection.ASCENDING, count = 25 }) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }

    if (!continuationToken) {
      const sorts = createSorts(sortProperty, sortDirection)
      return this.readInitialWritingQuotes(sorts, countNumber)
    }
    return this.readMoreWritingQuotes(continuationToken, countNumber)
  }

  readInitialWritingQuotes(requestedSorts, count) {
    const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
    return this.writingQuotesDao.readWritingQuotes(unambiguousSorts, count)
      .then(writingQuotes => {
        const continuationToken = createContinuationToken(unambiguousSorts, writingQuotes)
        return {
          writingQuotes,
          continuationToken,
        }
      })
  }

  readMoreWritingQuotes(continuationToken, count) {
    const {
      s: sortContinuations,
      f: filters,
    } = decodeContinuationToken(continuationToken)
    return this.writingQuotesDao.readMoreWritingQuotes(sortContinuations, count)
      .then(writingQuotes => {
        const nextContinuationToken = createNextContinuationToken(sortContinuations, writingQuotes, filters) || continuationToken
        return {
          writingQuotes,
          continuationToken: nextContinuationToken
        }
      })
  }

  updateWritingQuote({authToken, writingQuote}) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const validationErrors = this.writingQuoteValidator.validate(writingQuote)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError({writingQuote: validationErrors})
        }
        return userId
      })
      .then(userId => Promise.all([
        userId,
        this.writingQuotesDao.hasWritingQuoteChanged(writingQuote),
        this.writingsDao.hasWritingChanged(writingQuote.writing),
        diffUrls(this.writingQuotesDao, writingQuote),
      ]))
      .then( ([
        userId,
        writingQuoteHasChanged,
        writingHasChanged,
        urlDiffs,
      ]) => {
        if (!writingQuoteHasChanged && !writingHasChanged && !urlDiffs.haveChanged) {
          return writingQuote
        }

        const entityConflicts = {}
        const userActionConflicts = {}
        if (writingQuoteHasChanged) {
          entityConflicts[entityConflictCodes.ANOTHER_WRITING_QUOTE_HAS_SAME_TEXT] =
            this.writingQuotesDao.hasEquivalentWritingQuotes(writingQuote)
          assign(userActionConflicts, {
            [userActionConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_BASED_ON_THIS_WRITING_QUOTE]:
              this.writingQuotesDao.isBasisToJustificationsHavingOtherUsersVotes(userId, writingQuote),
            [userActionConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_WRITING_QUOTE]:
              this.writingQuotesDao.isBasisToOtherUsersJustifications(userId, writingQuote),
            [userActionConflictCodes.OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_WRITING_QUOTE]:
              this.writingQuotesDao.isBasisToJustificationsHavingOtherUsersCounters(userId, writingQuote),
          })
        }
        if (writingHasChanged) {
          const writing = writingQuote.writing

          entityConflicts[entityConflictCodes.ANOTHER_WRITING_HAS_EQUIVALENT_TITLE] =
            this.writingsDao.hasEquivalentWritings(writing)

          assign(userActionConflicts, {
            [userActionConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_BASED_ON_THIS_WRITING]:
              this.writingsDao.isWritingOfBasisToOtherUsersJustifications(userId, writing),
            [userActionConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_WRITING]:
              this.writingsDao.isWritingOfBasisToJustificationsHavingOtherUsersVotes(userId, writing),
            [userActionConflictCodes.OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_WRITING]:
              this.writingsDao.isWritingOfBasisToJustificationsHavingOtherUsersCounters(userId, writing),
          })
        }
        if (urlDiffs.haveChanged) {
          // When URLs are votable, ensure that no one has voted them (or at least up-voted them) before deleting
          // Adding should always be okay
        }

        return Promise.props({
          userId,
          now: new Date(),
          writingQuoteHasChanged,
          writingHasChanged,
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
        writingQuoteHasChanged,
        writingHasChanged,
        urlDiffs,
      }) => {

        const entityConflictCodes = keys(pickBy(entityConflicts))
        if (entityConflictCodes.length > 0) {
          throw new EntityConflictError(merge(
            WritingQuoteValidator.blankErrors(),
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
              WritingQuoteValidator.blankErrors(),
              {
                hasErrors: true,
                modelErrors: userActionsConflictCodes,
              }
            ))
          }
          this.logger.info(`User ${userId} overriding userActionsConflictCodes ${userActionsConflictCodes}`)
        }

        return {userId, now, writingQuoteHasChanged, writingHasChanged, urlDiffs}
      })
      .then( ({userId, now, writingQuoteHasChanged, writingHasChanged, urlDiffs}) => Promise.all([
        userId,
        now,
        writingQuoteHasChanged ?
          this.writingQuotesDao.updateWritingQuote(writingQuote) :
          writingQuote,
        writingHasChanged ?
          this.writingsService.updateWritingAsUser(userId, writingQuote.writing, now) :
          writingQuote.writing,
        urlDiffs.haveChanged ?
          this.updateWritingQuoteUrlsAsUser(writingQuote, urlDiffs, userId, now) :
          writingQuote.urls,
        writingQuoteHasChanged,
        writingHasChanged,
        urlDiffs.haveChanged,
      ]))
      .then( ([
        userId,
        now,
        writingQuote,
        writing,
        urls,
        writingQuoteHasChanged,
      ]) => {
        if (writingQuoteHasChanged) {
          this.actionsService.asyncRecordAction(userId, now, ActionType.UPDATE, ActionTargetType.WRITING_QUOTE,
            writingQuote.id)
        }
        return [writingQuote, writing, urls]
      })
      .then( ([writingQuote, writing, urls]) => {
        if (writingQuote.writing !== writing) {
          writingQuote = assign({}, writingQuote, {writing})
        }
        if (writingQuote.urls !== urls) {
          writingQuote = assign({}, writingQuote, {urls})
        }

        return writingQuote
      })
  }

  updateWritingQuoteUrlsAsUser(writingQuote, urlDiffs, userId, now) {
    return Promise.resolve()
      .then(() => {
        // deduplicate URLs, giving preference to those having IDs
        const urlByUrl = {}
        forEach(writingQuote.urls, url => {
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
        newUrls ? this.urlsService.createUrlsAsUser(newUrls, userId, now) : [],
      ]))
      .then( ([extantUrls, createdUrls]) => extantUrls.concat(createdUrls) )
      .then( updatedUrls => Promise.all([
        this.writingQuotesDao.readUrlsByWritingQuoteId(writingQuote.id),
        updatedUrls,
      ]))
      .then( ([currentUrls, updatedUrls]) => ({
        updatedUrls,
        addedUrls: differenceBy(updatedUrls, currentUrls, url => url.url),
        removedUrls: differenceBy(currentUrls, updatedUrls, url => url.url),
      }))
      .then( ({updatedUrls, addedUrls, removedUrls}) => Promise.all([
        updatedUrls,
        addedUrls.length > 0 ? this.writingQuotesDao.createWritingQuoteUrls(writingQuote, addedUrls, userId, now) : addedUrls,
        removedUrls.length > 0 ? this.writingQuotesDao.deleteWritingQuoteUrls(writingQuote, removedUrls, now) : removedUrls,
      ]))
      .then( ([updatedUrls, createdWritingQuoteUrls, deletedWritingQuoteUrls]) => {
        map(createdWritingQuoteUrls, writingQuoteUrl =>
          this.actionsService.asyncRecordAction(userId, now, ActionType.ASSOCIATE, ActionTargetType.WRITING_QUOTE,
            writingQuoteUrl.writingQuoteId, ActionSubjectType.URL, writingQuoteUrl.urlId))
        map(deletedWritingQuoteUrls, writingQuoteUrl =>
          this.actionsService.asyncRecordAction(userId, now, ActionType.DISASSOCIATE,
            ActionTargetType.WRITING_QUOTE, writingQuoteUrl.writingQuoteId, ActionSubjectType.URL,
            writingQuoteUrl.urlId))
        return updatedUrls
      })
      .then(updatedUrls => sortBy(updatedUrls, url => url.url))
  }

  createWritingQuoteAsUser(writingQuote, userId, now) {
    return Promise.all([
      this.writingsService.createWritingAsUser(writingQuote.writing, userId, now),
      this.urlsService.createUrlsAsUser(writingQuote.urls, userId, now),
    ])
      .then( ([{writing}, urls]) => {
        writingQuote.writing.id = writing.id
        return Promise.all([
          writing,
          urls,
          this.createJustWritingQuoteAsUser(writingQuote, userId, now)
        ])
      })
      .then( ([writing, urls, {isExtant, writingQuote}]) => {
        writingQuote.writing = writing
        writingQuote.urls = urls
        return Promise.all([
          isExtant,
          writingQuote,
          this.createWritingQuoteUrlsAsUser(writingQuote, userId, now)
        ])
      })
      .then( ([isExtant, writingQuote]) => ({isExtant, writingQuote}))
  }

  createJustWritingQuoteAsUser(writingQuote, userId, now) {
    return Promise.resolve()
      .then(() => writingQuote.id ?
        writingQuote :
        this.writingQuotesDao.readWritingQuotesEquivalentTo(writingQuote)
      )
      .then(equivalentWritingQuote => Promise.all([
        !!equivalentWritingQuote,
        equivalentWritingQuote || this.writingQuotesDao.createWritingQuote(writingQuote, userId, now)
      ]))
      .then( ([isExtant, writingQuote]) => {
        const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
        this.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetType.WRITING_QUOTE, writingQuote.id)
        return {
          isExtant,
          writingQuote,
        }
      })
  }

  createWritingQuoteUrlsAsUser(writingQuote, userId, now) {
    return this.writingQuotesDao.readWritingQuoteUrlsForWritingQuote(writingQuote)
      .then(extantWritingQuoteUrls => {
        const extantWritingQuoteUrlsByUrlId = {}
        forEach(extantWritingQuoteUrls, extantWritingQuoteUrl => {
          extantWritingQuoteUrlsByUrlId[extantWritingQuoteUrl.urlId] = extantWritingQuoteUrl
        })

        return map(writingQuote.urls, url => extantWritingQuoteUrlsByUrlId[url.id] ?
          extantWritingQuoteUrlsByUrlId[url.id] :
          this.writingQuotesDao.createWritingQuoteUrl(writingQuote, url, userId, now)
        )
      })
  }
}
