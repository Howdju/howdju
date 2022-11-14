const assign = require("lodash/assign");

const Promise = require("bluebird");
const pg = require("pg");

const {
  Database,
  makeTimestampToUtcMomentParser,
  PgTypeOids,
} = require("howdju-service-common");

exports.init = function init(provider) {
  pg.types.setTypeParser(
    PgTypeOids.TIMESTAMP,
    makeTimestampToUtcMomentParser(provider.logger)
  );

  const config = {
    user: provider.getConfigVal("DB_USER"),
    database: provider.getConfigVal("DB_NAME"),
    password: provider.getConfigVal("DB_PASSWORD"),
    host: provider.getConfigVal("DB_HOST"),
    port: provider.getConfigVal("DB_PORT", 5432),
    max: provider.getConfigVal("DB_POOL_MAX_CLIENTS", 10),
    // min: 1,
    // ssl: true,
    idleTimeoutMillis: provider.getConfigVal("DB_CLIENT_TIMEOUT", 3000),
    connectionTimeoutMillis: provider.getConfigVal(
      "DB_CLIENT_CONNECT_TIMEOUT",
      5000
    ),
    Promise,
  };

  const pool = new pg.Pool(config);
  pool.on("error", (err, client) =>
    provider.logger.error("database pool error", { err })
  );

  assign(provider, {
    pool,
    database: new Database(provider.logger, pool),
  });

  provider.logger.debug("databaseInit complete");
};
