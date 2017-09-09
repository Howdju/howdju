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

exports.WritingsService = class WritingsService {

  constructor(actionsService, writingsDao) {
    this.actionsService = actionsService
    this.writingsDao = writingsDao
  }

  readWritings({continuationToken, sortProperty = 'created', sortDirection = SortDirection.ASCENDING, count = 25 }) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }

    if (!continuationToken) {
      const sorts = createSorts(sortProperty, sortDirection)
      return this.readInitialWritings(sorts, countNumber)
    }
    return this.readMoreWritings(continuationToken, countNumber)
  }

  readInitialWritings (requestedSorts, count) {
    const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
    return this.writingsDao.readWritings(unambiguousSorts, count)
      .then(writings => {
        const continuationToken = createContinuationToken(unambiguousSorts, writings)
        return {
          writings,
          continuationToken,
        }
      })
  }

  readMoreWritings(continuationToken, count) {
    const {
      s: sortContinuations,
      f: filters,
    } = decodeContinuationToken(continuationToken)
    return this.writingsDao.readMoreWritings(sortContinuations, count)
      .then(writings => {
        const nextContinuationToken = createNextContinuationToken(sortContinuations, writings, filters) || continuationToken
        return {
          writings,
          continuationToken: nextContinuationToken
        }
      })
  }

  createWritingAsUser(writing, userId, now) {
    return Promise.resolve()
      .then(() => {
        if (writing.id) {
          return {
            isExtant: true,
            writing,
          }
        }
        return this.writingsDao.readWritingEquivalentTo(writing)
          .then( equivalentWriting => {
            if (equivalentWriting) {
              return {
                isExtant: true,
                writing: equivalentWriting,
              }
            }
            return this.writingsDao.createWriting(writing, userId, now)
              .then( (writing) => {
                this.actionsService.asyncRecordAction(userId, now, ActionType.CREATE, ActionTargetType.WRITING, writing.id)
                return writing
              })
              .then(writing => ({
                isExtant: false,
                writing
              }))
          })
      })
  }

  updateWritingAsUser(userId, writing, now) {
    return this.writingsDao.update(writing)
      .then( (writing) => {
        this.actionsService.asyncRecordAction(userId, now, ActionType.UPDATE, ActionTargetType.WRITING, writing.id)
        return writing
      })
  }
}
