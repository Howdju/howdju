const forEach = require('lodash/forEach')
const head = require('lodash/head')
const map = require('lodash/map')

const {
  requireArgs,
  newImpossibleError,
} = require('howdju-common')

const START_PREFIX = '_prefix__'
const STOP_PREFIX = '_stop_prefix'

class BaseDao {

  constructor(logger, database) {
    requireArgs({logger, database})
    this.logger = logger
    this.database = database
    // Must be set by subclasses
    this.mapper = null
  }

  async queryOne(queryName, sql, args, isRequired = false) {
    const result = await this.database.query(queryName, sql, args, true)
    const {fields, rows} = result

    if (rows.length > 1) {
      this.logger.warn(`Unexpected multiple (${rows.length}) for query ${queryName}`)
    }

    const row = head(rows)
    if (isRequired && !row) {
      throw newImpossibleError(`Missing required row for query ${queryName}`)
    }

    const rowObj = row && convertRowToObject(fields, row)

    return this.mapper(rowObj)
  }

  async queryMany(queryName, sql, args) {
    const {fields, rows} = await this.database.query(queryName, sql, args, true)
    const prefixed = map(rows, (row) => convertRowToObject(fields, row))
    return map(prefixed, this.mapper)
  }
}

/**
 * Converts a database array row to an objet with keys defined by `fields`.
 * Adds a <prefix> to all fields that follow a (dummy) field with the name: START_PREFIX<prefix>
 */
function convertRowToObject(fields, row) {
  const rowObj = {}
  let prefix = null
  forEach(fields, (field, i) => {
    const key = field.name
    if (key.startsWith(START_PREFIX)) {
      if (row[i] !== '') {
        throw newImpossibleError(`START_PREFIX ${START_PREFIX} must not appear with a value, but had value: ${row[i]}`)
      }
      prefix = key.substr(START_PREFIX.length)
    } else if (key === STOP_PREFIX) {
      if (row[i] !== '') {
        throw newImpossibleError(`STOP_PREFIX ${STOP_PREFIX} must not appear with a value, but had value: ${row[i]}`)
      }
      prefix = null
    } else if (prefix) {
      const prefixedKey = prefix + key
      rowObj[prefixedKey] = row[i]
    } else {
      rowObj[key] = row[i]
    }
  })
  return rowObj
}

module.exports = {
  convertRowToObject,
  BaseDao,
  START_PREFIX,
  STOP_PREFIX,
}