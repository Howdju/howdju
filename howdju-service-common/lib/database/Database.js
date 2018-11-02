const Promise = require('bluebird')
const moment = require('moment')
const isDate = require('lodash/isDate')
const map = require('lodash/map')

const {
  timestampFormatString,
  requireArgs,
} = require('howdju-common')


const toUtc = val => {
  if (isDate(val)) {
    return moment.utc(val).format(timestampFormatString)
  }
  if (moment.isMoment(val)) {
    return val.utc().format(timestampFormatString)
  }

  return val
}

exports.Database = class Database {

  constructor(logger, pool) {
    this.logger = logger
    this.pool = pool
  }

  query(queryName, sql, args) {
    requireArgs({queryName, sql})

    const utcArgs = map(args, toUtc)
    this.logger.silly('Database.query', {queryName, sql, utcArgs})
    return this.pool.query(sql, utcArgs)
  }

  queries(queryAndArgs) {
    return Promise.all(map(queryAndArgs, ({queryName, sql, args}) => this.query(queryName, sql, args)))
  }
}
