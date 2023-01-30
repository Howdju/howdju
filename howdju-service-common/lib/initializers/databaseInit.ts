import { toNumber } from "lodash";
import { Database, makePool } from "..";

import { ConfigProvider } from "./BaseProvider";

/** Provides the database and previous providers. */
export type DatabaseProvider = ReturnType<typeof databaseInit> & ConfigProvider;

/** Initializes the database. */
export function databaseInit(provider: ConfigProvider) {
  const config = {
    user: provider.getConfigVal("DB_USER"),
    database: provider.getConfigVal("DB_NAME"),
    password: provider.getConfigVal("DB_PASSWORD"),
    host: provider.getConfigVal("DB_HOST"),
    port: toNumber(provider.getConfigVal("DB_PORT", "5432")),
    max: toNumber(provider.getConfigVal("DB_POOL_MAX_CLIENTS", "10")),
    // min: 1,
    // ssl: true,
    idleTimeoutMillis: toNumber(
      provider.getConfigVal("DB_CLIENT_TIMEOUT", "3000")
    ),
    connectionTimeoutMillis: toNumber(
      provider.getConfigVal("DB_CLIENT_CONNECT_TIMEOUT", "5000")
    ),
  };
  const pool = makePool(provider.logger, config);

  provider.logger.debug("databaseInit complete");

  return {
    pool,
    database: new Database(provider.logger, pool),
  };
}
