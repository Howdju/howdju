const concat = require('lodash/concat')
const Promise = require('bluebird')
const toNumber = require('lodash/toNumber')

const {
  SortDirection,
  ActionType,
  ActionTargetType,
} = require('howdju-common')

const {
  createSorts,
  createContinuationToken,
  decodeContinuationToken,
  createNextContinuationToken,
} = require('./pagination')
const {
  RequestValidationError,
} = require('../serviceErrors')

exports.CitationsService = class CitationsService {

  constructor(actionsService, citationsDao) {
    this.actionsService = actionsService
    this.citationsDao = citationsDao
  }

  readCitations({continuationToken, sortProperty = 'created', sortDirection = SortDirection.ASCENDING, count = 25 }) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }

    if (!continuationToken) {
      const sorts = createSorts(sortProperty, sortDirection)
      return this.readInitialCitations(sorts, countNumber)
    }
    return this.readMoreCitations(continuationToken, countNumber)
  }

  readInitialCitations (requestedSorts, count) {
    const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
    return this.citationsDao.readCitations(unambiguousSorts, count)
      .then(citations => {
        const continuationToken = createContinuationToken(unambiguousSorts, citations)
        return {
          citations,
          continuationToken,
        }
      })
  }

  readMoreCitations(continuationToken, count) {
    const {
      s: sortContinuations,
      f: filters,
    } = decodeContinuationToken(continuationToken)
    return this.citationsDao.readMoreCitations(sortContinuations, count)
      .then(citations => {
        const nextContinuationToken = createNextContinuationToken(sortContinuations, citations, filters) || continuationToken
        return {
          citations,
          continuationToken: nextContinuationToken
        }
      })
  }

  createCitationAsUser(citation, userId, now) {
    return Promise.resolve()
      .then(() => {
        if (citation.id) {
          return {
            isExtant: true,
            citation,
          }
        }
        return this.citationsDao.readCitationEquivalentTo(citation)
          .then( equivalentCitation => {
            if (equivalentCitation) {
              return {
                isExtant: true,
                citation: equivalentCitation,
              }
            }
            return this.citationsDao.createCitation(citation, userId, now)
              .then( (citation) => {
                this.actionsService.asyncRecordAction(userId, now, ActionType.CREATE, ActionTargetType.CITATION, citation.id)
                return citation
              })
              .then(citation => ({
                isExtant: false,
                citation
              }))
          })
      })
  }

  updateCitationAsUser(userId, citation, now) {
    return this.citationsDao.update(citation)
      .then( (citation) => {
        this.actionsService.asyncRecordAction(userId, now, ActionType.UPDATE, ActionTargetType.CITATION, citation.id)
        return citation
      })
  }
}
