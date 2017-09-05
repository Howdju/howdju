const Promise = require('bluebird')
const pg = require('pg')

const {
  Database,
  makeTimestampToUtcMomentParser,
  PgTypeOids,
} = require('howdju-service-common')

const {logger} = require('./loggerInitialization')


pg.types.setTypeParser(PgTypeOids.TIMESTAMP, makeTimestampToUtcMomentParser(logger))

const config = {
  user: process.env['DB_USER'],
  database: process.env['DB_NAME'],
  password: process.env['DB_PASSWORD'],
  host: process.env['DB_HOST'],
  port: process.env['DB_PORT'] || 5432,
  max: process.env['DB_POOL_MAX_CLIENTS'] || 10,
  // min: 1,
  // ssl: true,
  idleTimeoutMillis: process.env['DB_CLIENT_TIMEOUT'] || 3000,
  connectionTimeoutMillis: process.env['DB_CLIENT_CONNECT_TIMEOUT'] || 5000,
  Promise,
}

const pool = new pg.Pool(config)
pool.on('error', (err, client) =>
  logger.error('database pool error', err.message, err.stack)
)

exports.database = new Database(logger, pool)
