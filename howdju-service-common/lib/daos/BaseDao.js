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
    const {fields, rows} = await this.database.query(queryName, sql, args)

    if (rows.length > 1) {
      this.logger.warn(`Unexpected multiple (${rows.length}) for query ${queryName}`)
    }

    const row = head(rows)
    if (isRequired && !row) {
      throw newImpossibleError(`Missing required row for query ${queryName}`)
    }

    if (row) {
      addPrefixes(fields, row)
    }

    return this.mapper(row)
  }

  async queryMany(queryName, sql, args) {
    const {fields, rows} = await this.database.query(queryName, sql, args)
    const prefixed = map(rows, (row) => addPrefixes(fields, row))
    return map(prefixed, this.mapper)
  }
}

/** Adds a <prefix> to all fields that follow a (dummy) field with the name: START_PREFIX<prefix> */
function addPrefixes(fields, row) {
  let prefix = null
  for (const field of fields) {
    const key = field.name
    if (key.startsWith(START_PREFIX)) {
      if (row[key] !== '') {
        throw newImpossibleError(`START_PREFIX ${START_PREFIX} must not appear with a value, but had value: ${row[key]}`)
      }
      prefix = key.substr(START_PREFIX.length)
      delete row[key]
    } else if (key === STOP_PREFIX) {
      if (row[key] !== '') {
        throw newImpossibleError(`STOP_PREFIX ${STOP_PREFIX} must not appear with a value, but had value: ${row[key]}`)
      }
      prefix = null
      delete row[key]
    } else if (prefix) {
      const prefixedKey = prefix + key
      row[prefixedKey] = row[key]
      delete row[key]
    }
  }
  return row
}

module.exports = {
  addPrefixes,
  BaseDao,
  START_PREFIX,
  STOP_PREFIX,
}