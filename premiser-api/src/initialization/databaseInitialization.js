const moment = require('moment')
const pg = require('pg')
const isDate = require('lodash/isDate')
const isString = require('lodash/isString')

const {
  Database
} = require('howdju-service-common')

const {logger} = require('./loggerInitialization')


const pgTypeOids = {
  TIMESTAMPTZ: 1184,
  TIMESTAMP: 1114,
}

const parseUtcTimestamp = val => {
  if (!val) return val

  if (isDate(val) || isString(val)) {
    try {
      // Interpret database timestamps as UTC
      return moment.utc(val)
    } catch (ex) {
      logger.error(`Error parsing timestamp type with moment`, ex)
    }
  }

  return val
}
pg.types.setTypeParser(pgTypeOids.TIMESTAMP, parseUtcTimestamp)

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
pool.on('error', (err, client) => logger.error('idle client error', err.message, err.stack))

exports.database = new Database(logger, pool)
