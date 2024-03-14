import { toNumber } from "lodash";
import { PoolConfig } from "pg";
import { Database, makePool } from "../database";

import { ConfigProvider } from "./BaseProvider";

/** Provides the database and previous providers. */
export type DatabaseProvider = ReturnType<typeof databaseInit> & ConfigProvider;

/** Initializes the database. */
export function databaseInit(provider: ConfigProvider) {
  const config: PoolConfig = {
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

  const clientProvider = {
    getClient: () => pool.connect(),
    close: () => pool.end(),
  };

  provider.logger.debug("databaseInit complete");

  return {
    database: new Database(provider.logger, clientProvider),
    databaseClientProvider: clientProvider,
  };
}
