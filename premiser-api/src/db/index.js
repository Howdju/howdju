const Promise = require('bluebird')
const pg = require('pg')
const moment = require('moment')
const {logger} = require('../logger')
const configureTypes = require('./configureTypes')
const isDate = require('lodash/isDate')
const map = require('lodash/map')

configureTypes(pg.types)

const config = {
  user: process.env['DB_USER'],
  database: process.env['DB_NAME'],
  password: process.env['DB_PASSWORD'],
  host: process.env['DB_HOST'],
  port: process.env['DB_PORT'] || 5432,
  max: process.env['DB_POOL_MAX_CLIENTS'] || 10,
  idleTimeoutMillis: process.env['DB_CLIENT_TIMEOUT'] || 3000,
}


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

const pool = new pg.Pool(config)

pool.on('error', (err, client) => console.error('idle client error', err.message, err.stack))

exports.query = (sql, args) => Promise.resolve(pool.connect())
    .then(client => {
      logger.silly('db.query:', {sql, args})
      const utcArgs = map(args, toUtc)
      return Promise.resolve(client.query(sql, utcArgs)).finally(() => client.release())
    })
exports.queries = queryAndArgs => Promise.resolve(pool.connect())
    .then(client => Promise.all(queryAndArgs.map( ({sql, args}) => {
      logger.silly('db.query:', {sql, args})
      const utcArgs = map(args, toUtc)
      return Promise.resolve(client.query.call(client, sql, utcArgs))
    } ))
        .finally(() => client.release()))