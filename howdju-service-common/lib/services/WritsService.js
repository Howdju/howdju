const concat = require('lodash/concat')
const Promise = require('bluebird')
const toNumber = require('lodash/toNumber')

const {
  SortDirections,
  ActionType,
  ActionTargetTypes,
} = require('howdju-common')

const {
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

  readWritForId(writId) {
    this.writsDao.readWritForId(writId)
  }

  readWrits({sorts, continuationToken, count = 25 }) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }

    if (!continuationToken) {
      return this.readInitialWrits(sorts, countNumber)
    }
    return this.readMoreWrits(continuationToken, countNumber)
  }

  readInitialWrits (requestedSorts, count) {
    const disambiguationSorts = [{property: 'id', direction: SortDirections.ASCENDING}]
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
      sorts,
      filters,
    } = decodeContinuationToken(continuationToken)
    return this.writsDao.readMoreWrits(sorts, count)
      .then(writs => {
        const nextContinuationToken = createNextContinuationToken(sorts, writs, filters) || continuationToken
        return {
          writs,
          continuationToken: nextContinuationToken
        }
      })
  }

  updateWritAsUser(userId, writ, now) {
    return this.writsDao.update(writ)
      .then( (writ) => {
        this.actionsService.asyncRecordAction(userId, now, ActionType.UPDATE, ActionTargetTypes.WRIT, writ.id)
        return writ
      })
  }

  readOrCreateValidWritAsUser(writ, userId, now) {
    return Promise.resolve()
      .then(() => {
        if (writ.id) {
          return Promise.props({
            isExtant: true,
            writ: this.readWritForId(writ, {userId})
          })
        }

        return readOrCreateEquivalentWritAsUser(this, writ, userId, now)
      })
  }
}

function readOrCreateEquivalentWritAsUser(service, writ, userId, now) {
  return service.writsDao.readWritEquivalentTo(writ)
    .then( (equivalentWrit) => Promise.all([
      !!equivalentWrit,
      equivalentWrit || service.writsDao.createWrit(writ, userId, now)
    ]))
    .then( ([isExtant, writ]) => {
      const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
      service.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetTypes.WRIT, writ.id)

      return {
        isExtant,
        writ
      }
    })
}
