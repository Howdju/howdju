import { Logger } from "howdju-common";
import moment from "moment";
import pg, { PoolConfig } from "pg";

export const PgTypeOids = {
  TIMESTAMPTZ: 1184,
  TIMESTAMP: 1114,
};

export const makeTimestampToUtcMomentParser =
  (logger: Logger) => (val: any) => {
    if (!val) return val;

    try {
      // Interpret database timestamps as UTC
      return moment.utc(val);
    } catch (err) {
      logger.error(`Error parsing timestamp type with moment`, { err });
    }

    return val;
  };

export function makePool(logger: Logger, config: PoolConfig) {
  pg.types.setTypeParser(
    PgTypeOids.TIMESTAMP,
    makeTimestampToUtcMomentParser(logger)
  );
  const pool = new pg.Pool(config);
  pool.on("error", (err, _client) =>
    logger.error("database pool error", { err })
  );
  return pool;
}
