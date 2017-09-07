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
  OTHER_CITATION_REFERENCES_HAVE_SAME_CITATION_QUOTE_CONFLICT,
  OTHER_CITATIONS_HAVE_EQUIVALENT_TEXT_CONFLICT,
  OTHER_USERS_HAVE_VERIFIED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_REFERENCE_CONFLICT,
  OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_USING_THIS_CITATION_REFERENCE_CONFLICT,
  OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_REFERENCE_CONFLICT,
  OTHER_USERS_HAVE_VERIFIED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_CONFLICT,
  OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_USING_THIS_CITATION_CONFLICT,
  OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_CONFLICT,
} = require('howdju-common')

const {
  CitationReferenceValidator
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

const diffUrls = (citationReferencesDao, citationReference) => Promise.resolve()
  .then(() => citationReferencesDao.readUrlsByCitationReferenceId(citationReference.id))
  .then(extantUrls => {
    const addedUrls = differenceBy(citationReference.urls, [extantUrls], url => url.url)
    const removedUrls = differenceBy(extantUrls, [citationReference.urls], url => url.url)
    const haveChanged = addedUrls.length > 0 || removedUrls.length > 0
    return {
      addedUrls,
      removedUrls,
      haveChanged
    }
  })

exports.CitationReferencesService = class CitationReferencesService {
  constructor(
    logger,
    citationReferenceValidator,
    actionsService,
    authService,
    citationsService,
    urlsService,
    citationReferencesDao,
    citationsDao,
    permissionsDao
  ) {
    this.logger = logger
    this.citationReferenceValidator = citationReferenceValidator
    this.actionsService = actionsService
    this.authService = authService
    this.citationsService = citationsService
    this.urlsService = urlsService
    this.citationReferencesDao = citationReferencesDao
    this.citationsDao = citationsDao
    this.permissionsDao = permissionsDao
  }

  readCitationReference(citationReferenceId) {
    return this.citationReferencesDao.read(citationReferenceId)
  }

  readCitationReferences({continuationToken, sortProperty = 'created', sortDirection = SortDirection.ASCENDING, count = 25 }) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }

    if (!continuationToken) {
      const sorts = createSorts(sortProperty, sortDirection)
      return this.readInitialCitationReferences(sorts, countNumber)
    }
    return this.readMoreCitationReferences(continuationToken, countNumber)
  }

  readInitialCitationReferences(requestedSorts, count) {
    const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
    return this.citationReferencesDao.readCitationReferences(unambiguousSorts, count)
      .then(citationReferences => {
        const continuationToken = createContinuationToken(unambiguousSorts, citationReferences)
        return {
          citationReferences,
          continuationToken,
        }
      })
  }

  readMoreCitationReferences(continuationToken, count) {
    const {
      s: sortContinuations,
      f: filters,
    } = decodeContinuationToken(continuationToken)
    return this.citationReferencesDao.readMoreCitationReferences(sortContinuations, count)
      .then(citationReferences => {
        const nextContinuationToken = createNextContinuationToken(sortContinuations, citationReferences, filters) || continuationToken
        return {
          citationReferences,
          continuationToken: nextContinuationToken
        }
      })
  }

  updateCitationReference({authToken, citationReference}) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const validationErrors = this.citationReferenceValidator.validate(citationReference)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError({citationReference: validationErrors})
        }
        return userId
      })
      .then(userId => Promise.all([
        userId,
        this.citationReferencesDao.hasCitationReferenceChanged(citationReference),
        this.citationsDao.hasCitationChanged(citationReference.citation),
        diffUrls(this.citationReferencesDao, citationReference),
      ]))
      .then( ([
        userId,
        citationReferenceHasChanged,
        citationHasChanged,
        urlDiffs,
      ]) => {
        if (!citationReferenceHasChanged && !citationHasChanged && !urlDiffs.haveChanged) {
          return citationReference
        }

        const entityConflicts = {}
        const userActionConflicts = {}
        if (citationReferenceHasChanged) {
          entityConflicts[OTHER_CITATION_REFERENCES_HAVE_SAME_CITATION_QUOTE_CONFLICT] =
            this.citationReferencesDao.hasEquivalentCitationReferences(citationReference)
          assign(userActionConflicts, {
            [OTHER_USERS_HAVE_VERIFIED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_REFERENCE_CONFLICT]:
              this.citationReferencesDao.isBasisToJustificationsHavingOtherUsersVotes(userId, citationReference),
            [OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_USING_THIS_CITATION_REFERENCE_CONFLICT]:
              this.citationReferencesDao.isBasisToOtherUsersJustifications(userId, citationReference),
            [OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_REFERENCE_CONFLICT]:
              this.citationReferencesDao.isBasisToJustificationsHavingOtherUsersCounters(userId, citationReference),
          })
        }
        if (citationHasChanged) {
          const citation = citationReference.citation

          entityConflicts[OTHER_CITATIONS_HAVE_EQUIVALENT_TEXT_CONFLICT] = this.citationsDao.hasEquivalentCitations(citation)

          assign(userActionConflicts, {
            [OTHER_USERS_HAVE_VERIFIED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_CONFLICT]:
              this.citationsDao.isCitationOfBasisToOtherUsersJustifications(userId, citation),
            [OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_USING_THIS_CITATION_CONFLICT]:
              this.citationsDao.isCitationOfBasisToJustificationsHavingOtherUsersVotes(userId, citation),
            [OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_CONFLICT]:
              this.citationsDao.isCitationOfBasisToJustificationsHavingOtherUsersCounters(userId, citation),
          })
        }
        if (urlDiffs.haveChanged) {
          // When URLs are votable, ensure that no one has voted them (or at least up-voted them) before deleting
          // Adding should always be okay
        }

        return Promise.props({
          userId,
          now: new Date(),
          citationReferenceHasChanged,
          citationHasChanged,
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
        citationReferenceHasChanged,
        citationHasChanged,
        urlDiffs,
      }) => {

        const entityConflictCodes = keys(pickBy(entityConflicts))
        if (entityConflictCodes.length > 0) {
          throw new EntityConflictError(merge(
            CitationReferenceValidator.blankErrors(),
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
              CitationReferenceValidator.blankErrors(),
              {
                hasErrors: true,
                modelErrors: userActionsConflictCodes,
              }
            ))
          }
          this.logger.info(`User ${userId} overriding userActionsConflictCodes ${userActionsConflictCodes}`)
        }

        return {userId, now, citationReferenceHasChanged, citationHasChanged, urlDiffs}
      })
      .then( ({userId, now, citationReferenceHasChanged, citationHasChanged, urlDiffs}) => Promise.all([
        userId,
        now,
        citationReferenceHasChanged ?
          this.citationReferencesDao.updateCitationReference(citationReference) :
          citationReference,
        citationHasChanged ?
          this.citationsService.updateCitationAsUser(userId, citationReference.citation, now) :
          citationReference.citation,
        urlDiffs.haveChanged ?
          this.updateCitationReferenceUrlsAsUser(citationReference, urlDiffs, userId, now) :
          citationReference.urls,
        citationReferenceHasChanged,
        citationHasChanged,
        urlDiffs.haveChanged,
      ]))
      .then( ([
        userId,
        now,
        citationReference,
        citation,
        urls,
        citationReferenceHasChanged,
      ]) => {
        if (citationReferenceHasChanged) {
          this.actionsService.asyncRecordAction(userId, now, ActionType.UPDATE, ActionTargetType.CITATION_REFERENCE,
            citationReference.id)
        }
        return [citationReference, citation, urls]
      })
      .then( ([citationReference, citation, urls]) => {
        if (citationReference.citation !== citation) {
          citationReference = assign({}, citationReference, {citation})
        }
        if (citationReference.urls !== urls) {
          citationReference = assign({}, citationReference, {urls})
        }

        return citationReference
      })
  }

  updateCitationReferenceUrlsAsUser(citationReference, urlDiffs, userId, now) {
    return Promise.resolve()
      .then(() => {
        // deduplicate URLs, giving preference to those having IDs
        const urlByUrl = {}
        forEach(citationReference.urls, url => {
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
        this.citationReferencesDao.readUrlsByCitationReferenceId(citationReference.id),
        updatedUrls,
      ]))
      .then( ([currentUrls, updatedUrls]) => ({
        updatedUrls,
        addedUrls: differenceBy(updatedUrls, currentUrls, url => url.url),
        removedUrls: differenceBy(currentUrls, updatedUrls, url => url.url),
      }))
      .then( ({updatedUrls, addedUrls, removedUrls}) => Promise.all([
        updatedUrls,
        addedUrls.length > 0 ? this.citationReferencesDao.createCitationReferenceUrls(citationReference, addedUrls, userId, now) : addedUrls,
        removedUrls.length > 0 ? this.citationReferencesDao.deleteCitationReferenceUrls(citationReference, removedUrls, now) : removedUrls,
      ]))
      .then( ([updatedUrls, createdCitationReferenceUrls, deletedCitationReferenceUrls]) => {
        map(createdCitationReferenceUrls, citationReferenceUrl =>
          this.actionsService.asyncRecordAction(userId, now, ActionType.ASSOCIATE, ActionTargetType.CITATION_REFERENCE,
            citationReferenceUrl.citationReferenceId, ActionSubjectType.URL, citationReferenceUrl.urlId))
        map(deletedCitationReferenceUrls, citationReferenceUrl =>
          this.actionsService.asyncRecordAction(userId, now, ActionType.DISASSOCIATE,
            ActionTargetType.CITATION_REFERENCE, citationReferenceUrl.citationReferenceId, ActionSubjectType.URL,
            citationReferenceUrl.urlId))
        return updatedUrls
      })
      .then(updatedUrls => sortBy(updatedUrls, url => url.url))
  }

  createCitationReferenceAsUser(citationReference, userId, now) {
    return Promise.all([
      this.citationsService.createCitationAsUser(citationReference.citation, userId, now),
      this.urlsService.createUrlsAsUser(citationReference.urls, userId, now),
    ])
      .then( ([{citation}, urls]) => {
        citationReference.citation.id = citation.id
        return Promise.all([
          citation,
          urls,
          this.createJustCitationReferenceAsUser(citationReference, userId, now)
        ])
      })
      .then( ([citation, urls, {isExtant, citationReference}]) => {
        citationReference.citation = citation
        citationReference.urls = urls
        return Promise.all([
          isExtant,
          citationReference,
          this.createCitationReferenceUrlsAsUser(citationReference, userId, now)
        ])
      })
      .then( ([isExtant, citationReference]) => ({isExtant, citationReference}))
  }

  createJustCitationReferenceAsUser(citationReference, userId, now) {
    return Promise.resolve()
      .then(() => citationReference.id ?
        citationReference :
        this.citationReferencesDao.readCitationReferencesEquivalentTo(citationReference)
      )
      .then(equivalentCitationReference => Promise.all([
        !!equivalentCitationReference,
        equivalentCitationReference || this.citationReferencesDao.createCitationReference(citationReference, userId, now)
      ]))
      .then( ([isExtant, citationReference]) => {
        const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
        this.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetType.CITATION_REFERENCE, citationReference.id)
        return {
          isExtant,
          citationReference,
        }
      })
  }

  createCitationReferenceUrlsAsUser(citationReference, userId, now) {
    return this.citationReferencesDao.readCitationReferenceUrlsForCitationReference(citationReference)
      .then(extantCitationReferenceUrls => {
        const extantCitationReferenceUrlsByUrlId = {}
        forEach(extantCitationReferenceUrls, extantCitationReferenceUrl => {
          extantCitationReferenceUrlsByUrlId[extantCitationReferenceUrl.urlId] = extantCitationReferenceUrl
        })

        return map(citationReference.urls, url => extantCitationReferenceUrlsByUrlId[url.id] ?
          extantCitationReferenceUrlsByUrlId[url.id] :
          this.citationReferencesDao.createCitationReferenceUrl(citationReference, url, userId, now)
        )
      })
  }
}
