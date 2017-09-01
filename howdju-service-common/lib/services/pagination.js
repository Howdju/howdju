const URLSafeBase64 = require('urlsafe-base64')

const cloneDeep = require('lodash/cloneDeep')
const forEach = require('lodash/forEach')
const get = require('lodash/get')
const isString = require('lodash/isString')
const last = require('lodash/last')
const map = require('lodash/map')

const {
  ContinuationSortDirection,
  SortDirection,
} = require('howdju-common')

exports.createSorts = (sortProperty, sortDirection) => {
  const sortProperties = isString(sortProperty) ? [sortProperty] : sortProperty
  const sortDirections = isString(sortDirection) ? [sortDirection] : sortDirection
  const sorts = []
  forEach(sortProperties, (sortProperty, index) => {
    sorts.push({
      property: sortProperty,
      direction: sortDirections[index] || SortDirection.ASCENDING
    })
  })
  return sorts
}

exports.createContinuationInfo = (sorts, lastEntity, filters) => {
  const sortContinuations = map(sorts, ({property, direction}) => {
    const continuationInfo = {
      p: property,
      v: get(lastEntity, property)
    }
    // Only set the direction if necessary to overcome the default
    if (direction === SortDirection.DESCENDING) {
      continuationInfo.d = ContinuationSortDirection.DESCENDING
    }
    return continuationInfo
  })
  return {
    s: sortContinuations,
    f: filters,
  }
}

exports.createNextContinuationToken = (sortContinuations, entities, filters) => {
  const lastEntity = last(entities)
  let nextContinuationToken
  if (lastEntity) {
    // Everything from the previous token should be fine except we need to update the values
    const nextContinuationInfo = exports.updateContinuationInfo(sortContinuations, lastEntity, filters)
    nextContinuationToken = exports.encodeContinuationToken(nextContinuationInfo)
  }
  return nextContinuationToken
}

exports.createContinuationToken = (sorts, entities, filters) => {
  const lastEntity = last(entities)
  let continuationToken = null

  if (lastEntity) {
    const continuationInfos = exports.createContinuationInfo(sorts, lastEntity, filters)
    continuationToken = exports.encodeContinuationToken(continuationInfos)
  }
  return continuationToken
}

exports.decodeContinuationToken = continuationToken => {
  const decoded = URLSafeBase64.decode(new Buffer(continuationToken))
  const parsed = JSON.parse(decoded)
  return parsed
}

exports.encodeContinuationToken = continuationInfo => URLSafeBase64.encode(new Buffer(JSON.stringify(continuationInfo)))

exports.updateContinuationInfo = (sortContinuations, lastEntity, filters) => {
  const newSortContinuations = map(sortContinuations, sortContinuation => {
    const nextSortContinuation = cloneDeep(sortContinuation)
    nextSortContinuation.v = get(lastEntity, sortContinuation.p)
    return nextSortContinuation
  })

  return {
    s: newSortContinuations,
    f: filters,
  }
}