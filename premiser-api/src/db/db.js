const Promise = require('bluebird')
const pg = require('pg')
const map = require('lodash/map')

const {logger} = require('../logging')
const configureTypes = require('./configureTypes')
const {toUtc} = require('./util')

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

const pool = new pg.Pool(config)

pool.on('error', (err, client) => console.error('idle client error', err.message, err.stack))

exports.query = (sql, args) => Promise.resolve()
    .then(() => {
      if (!sql) {
        throw new Error('sql is required')
      }
      return Promise.resolve(pool.connect())
    })
    .then(client => {
      const utcArgs = map(args, toUtc)
      logger.silly('db.query sql:', sql)
      logger.silly('db.query utcArgs:', utcArgs)
      return Promise.resolve(client.query(sql, utcArgs))
          .finally(() => client.release())
    })
exports.queries = queryAndArgs => Promise.resolve(pool.connect())
    .then(client => Promise.all(map(queryAndArgs, ({sql, args}) => {
      const utcArgs = map(args, toUtc)
      logger.silly('db.query sql:', sql)
      logger.silly('db.query utcArgs:', utcArgs)
      return Promise.resolve(client.query.call(client, sql, utcArgs))
    }))
    .finally(() => client.release()))