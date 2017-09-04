const Promise = require('bluebird')
const moment = require('moment')
const isDate = require('lodash/isDate')
const map = require('lodash/map')


const formatString = 'YYYY-MM-DDTHH:mm:ss.SSS[Z]'

const toUtc = val => {
  if (isDate(val)) {
    return moment.utc(val).format(formatString)
  }
  if (moment.isMoment(val)) {
    return val.utc().format(formatString)
  }

  return val
}

exports.Database = class Database {

  constructor(logger, pool) {
    this.logger = logger
    this.pool = pool
  }
  
  query(sql, args) {
    if (!sql) {
      throw new Error('sql is required')
    }

    const utcArgs = map(args, toUtc)
    this.logger.silly('Database.query sql:', sql)
    this.logger.silly('Database.query utcArgs:', utcArgs)
    return this.pool.query(sql, utcArgs)
  }

  queries(queryAndArgs) {
    return Promise.all(map(queryAndArgs, ({sql, args}) => this.query(sql, args)))
  }
}

