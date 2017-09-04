const Promise = require('bluebird')
const pg = require('pg')

const {
  Database,
  setTimestampParser,
  makeTimestampToUtcMomentParser,
} = require('howdju-service-common')

const {logger} = require('./loggerInitialization')


setTimestampParser(makeTimestampToUtcMomentParser(logger))

const config = {
  user: process.env['DB_USER'],
  database: process.env['DB_NAME'],
  password: process.env['DB_PASSWORD'],
  host: process.env['DB_HOST'],
  port: process.env['DB_PORT'] || 5432,
  max: process.env['DB_POOL_MAX_CLIENTS'] || 10,
  idleTimeoutMillis: process.env['DB_CLIENT_IDLE_TIMEOUT'] || 10000,
  connectionTimeoutMillis: process.env['DB_CLIENT_CONNECT_TIMEOUT'] || 5000,
  Promise,
}

const pool = new pg.Pool(config)
pool.on('error', (err, client) =>
  logger.error('database pool error', err.message, err.stack)
)
pool.on('connect', (client) => {
  logger.silly('database pool connected')
})
pool.on('acquire', (client) =>
  logger.silly('database pool acquired')
)

exports.database = new Database(logger, pool)
