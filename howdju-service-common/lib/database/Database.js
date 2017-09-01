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
    return Promise.resolve()
      .then(() => {
        if (!sql) {
          throw new Error('sql is required')
        }
        return this.pool.connect()
      })
      .then( (client) => {
        const utcArgs = map(args, toUtc)
        this.logger.silly('db.query sql:', sql)
        this.logger.silly('db.query utcArgs:', utcArgs)
        return Promise.resolve(client.query(sql, utcArgs))
          .finally(() => client.release())
      })
  }

  queries(queryAndArgs) {
    return Promise.resolve(this.pool.connect())
      .then(client => Promise.all(map(queryAndArgs, ({sql, args}) => {
        const utcArgs = map(args, toUtc)
        this.logger.silly('db.query sql:', sql)
        this.logger.silly('db.query utcArgs:', utcArgs)
        return Promise.resolve(client.query.call(client, sql, utcArgs))
      }))
        .finally(() => client.release()))
  }
}

