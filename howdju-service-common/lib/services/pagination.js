const URLSafeBase64 = require('urlsafe-base64')

const cloneDeep = require('lodash/cloneDeep')
const forEach = require('lodash/forEach')
const get = require('lodash/get')
const isString = require('lodash/isString')
const last = require('lodash/last')
const map = require('lodash/map')
const mapKeys = require('lodash/mapKeys')
const reduce = require('lodash/reduce')

const {
  SortDirection,
} = require('howdju-common')


/** Store the sort continuation properties with single-letter representations to cut down on the size of the payload */
const ContinuationTokenShortPropertyNames = {
  sorts: 's',
  filters: 'f',
}
const ContinuationTokenFullPropertyNames = reduce(ContinuationTokenShortPropertyNames, (acc, short, long) => {
  acc[short] = long
  return acc
}, {})
const SortContinuationShortPropertyNames = {
  property: 'p',
  direction: 'd',
  value: 'v',
}
const SortContinuationFullPropertyNames = reduce(SortContinuationShortPropertyNames, (acc, short, long) => {
  acc[short] = long
  return acc
}, {})
/** Shorter than SortDirection so that the continuations tokens are smaller */
const ShortSortDirection = {
  [SortDirection.ASCENDING]: 'a',
  [SortDirection.DESCENDING]: 'd',
}
const LongSortDirection = reduce(ShortSortDirection, (acc, short, long) => {
  acc[short] = long
  return acc
}, {})


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

const shortenContinuationInfoSort = (sort) => {
  if (sort.direction) {
    sort.direction = ShortSortDirection[sort.direction]
  }
  const shortSort = mapKeys(sort, (value, key) => SortContinuationShortPropertyNames[key])
  return shortSort
}

const lengthenContinuationInfoSort = (sort) => {
  const longSort = mapKeys(sort, (value, key) => SortContinuationFullPropertyNames[key])

  if (longSort.direction) {
    longSort.direction = LongSortDirection[longSort.direction]
  }

  return longSort
}

exports.createContinuationInfo = (sorts, lastEntity, filters) => {
  const continuationSorts = map(sorts, ({property, direction}) => {
    const value = lastEntity[property]
    const continuationInfo = {
      property,
      value,
    }
    // Only set the direction if necessary to overcome the default
    if (direction === SortDirection.DESCENDING) {
      continuationInfo.direction = SortDirection.DESCENDING
    }
    return continuationInfo
  })
  const continuationInfo = {
    sorts: continuationSorts,
    filters,
  }

  if (continuationInfo.sorts) {
    continuationInfo.sorts = map(continuationInfo.sorts, shortenContinuationInfoSort)
  }
  const shortNameContinuationInfo = mapKeys(continuationInfo, (value, key) => ContinuationTokenShortPropertyNames[key])

  return shortNameContinuationInfo
}

exports.createNextContinuationToken = (sorts, entities, filters) => {
  const lastEntity = last(entities)
  let nextContinuationToken
  if (lastEntity) {
    // Everything from the previous token should be fine except we need to update the values
    const nextContinuationInfo = exports.updateContinuationInfo(sorts, lastEntity, filters)

    if (nextContinuationInfo.sorts) {
      nextContinuationInfo.sorts = map(nextContinuationInfo.sorts, shortenContinuationInfoSort)
    }
    const shortNextContinuationInfo = mapKeys(nextContinuationInfo, (value, key) => ContinuationTokenShortPropertyNames[key])

    nextContinuationToken = exports.encodeContinuationToken(shortNextContinuationInfo)
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
  const continuationInfo = JSON.parse(decoded)

  const fullNameContinuationInfo = mapKeys(continuationInfo, (value, key) => ContinuationTokenFullPropertyNames[key])
  if (fullNameContinuationInfo.sorts) {
    fullNameContinuationInfo.sorts = map(fullNameContinuationInfo.sorts, lengthenContinuationInfoSort)
  }

  return fullNameContinuationInfo
}

exports.encodeContinuationToken = continuationInfo => URLSafeBase64.encode(new Buffer(JSON.stringify(continuationInfo)))

exports.updateContinuationInfo = (sorts, lastEntity, filters) => {
  const newSorts = map(sorts, sort => {
    const nextSortContinuation = cloneDeep(sort)
    nextSortContinuation.value = get(lastEntity, sort.property)
    return nextSortContinuation
  })

  return {
    sorts: newSorts,
    filters,
  }
}
