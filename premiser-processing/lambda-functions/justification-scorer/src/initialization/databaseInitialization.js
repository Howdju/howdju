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
  idleTimeoutMillis: process.env['DB_CLIENT_TIMEOUT'] || 3000,
}

const pool = new pg.Pool(config)
pool.on('error', (err, client) => logger.error('idle client error', err.message, err.stack))

exports.database = new Database(logger, pool)
