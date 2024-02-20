import pg from "pg";
import { toNumber } from "lodash";

import {
  Database,
  makeTimestampToUtcMomentParser,
  PgTypeOids,
} from "howdju-service-common";

import { logger } from "./loggerInitialization";

pg.types.setTypeParser(
  PgTypeOids.TIMESTAMP,
  makeTimestampToUtcMomentParser(logger)
);

const config = {
  user: process.env["DB_USER"],
  database: process.env["DB_NAME"],
  password: process.env["DB_PASSWORD"],
  host: process.env["DB_HOST"],
  port: toNumber(process.env["DB_PORT"]) || 5432,
  max: toNumber(process.env["DB_POOL_MAX_CLIENTS"]) || 10,
  idleTimeoutMillis: toNumber(process.env["DB_CLIENT_IDLE_TIMEOUT"]) || 10000,
  connectionTimeoutMillis:
    toNumber(process.env["DB_CLIENT_CONNECT_TIMEOUT"]) || 5000,
};

export const pool = new pg.Pool(config);
pool.on("error", (err) => logger.error("database pool error", { err }));

export const database = new Database(logger, pool);
