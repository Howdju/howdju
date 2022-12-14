const moment = require("moment");
const pg = require("pg");

exports.PgTypeOids = {
  TIMESTAMPTZ: 1184,
  TIMESTAMP: 1114,
};

exports.makeTimestampToUtcMomentParser = (logger) => (val) => {
  if (!val) return val;

  try {
    // Interpret database timestamps as UTC
    return moment.utc(val);
  } catch (err) {
    logger.error(`Error parsing timestamp type with moment`, { err });
  }

  return val;
};

exports.makePool = function makePool(logger, config) {
  pg.types.setTypeParser(
    exports.PgTypeOids.TIMESTAMP,
    exports.makeTimestampToUtcMomentParser(logger)
  );
  const pool = new pg.Pool(config);
  pool.on("error", (err, client) =>
    logger.error("database pool error", { err })
  );
  return pool;
};
