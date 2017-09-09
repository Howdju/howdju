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

exports.WritsService = class WritsService {

  constructor(actionsService, writsDao) {
    this.actionsService = actionsService
    this.writsDao = writsDao
  }

  readWrits({continuationToken, sortProperty = 'created', sortDirection = SortDirection.ASCENDING, count = 25 }) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }

    if (!continuationToken) {
      const sorts = createSorts(sortProperty, sortDirection)
      return this.readInitialWrits(sorts, countNumber)
    }
    return this.readMoreWrits(continuationToken, countNumber)
  }

  readInitialWrits (requestedSorts, count) {
    const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
    return this.writsDao.readWrits(unambiguousSorts, count)
      .then(writs => {
        const continuationToken = createContinuationToken(unambiguousSorts, writs)
        return {
          writs,
          continuationToken,
        }
      })
  }

  readMoreWrits(continuationToken, count) {
    const {
      s: sortContinuations,
      f: filters,
    } = decodeContinuationToken(continuationToken)
    return this.writsDao.readMoreWrits(sortContinuations, count)
      .then(writs => {
        const nextContinuationToken = createNextContinuationToken(sortContinuations, writs, filters) || continuationToken
        return {
          writs,
          continuationToken: nextContinuationToken
        }
      })
  }

  createWritAsUser(writ, userId, now) {
    return Promise.resolve()
      .then(() => {
        if (writ.id) {
          return {
            isExtant: true,
            writ,
          }
        }
        return this.writsDao.readWritEquivalentTo(writ)
          .then( equivalentWrit => {
            if (equivalentWrit) {
              return {
                isExtant: true,
                writ: equivalentWrit,
              }
            }
            return this.writsDao.createWrit(writ, userId, now)
              .then( (writ) => {
                this.actionsService.asyncRecordAction(userId, now, ActionType.CREATE, ActionTargetType.WRIT, writ.id)
                return writ
              })
              .then(writ => ({
                isExtant: false,
                writ
              }))
          })
      })
  }

  updateWritAsUser(userId, writ, now) {
    return this.writsDao.update(writ)
      .then( (writ) => {
        this.actionsService.asyncRecordAction(userId, now, ActionType.UPDATE, ActionTargetType.WRIT, writ.id)
        return writ
      })
  }
}
