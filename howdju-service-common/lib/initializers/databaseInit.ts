import { toNumber } from "lodash";
import { PoolConfig } from "pg";

import { Database, makePool } from "../database";
import { ConfigProvider } from "./BaseProvider";
import { AsyncConfig, DATABASE_CONNECTION_INFO } from "./parameterStore";

/** Provides the database and previous providers. */
export type DatabaseProvider = ReturnType<typeof databaseInit> & ConfigProvider;

/** Initializes the database. */
export function databaseInit(
  provider: ConfigProvider,
  asyncConfig: Promise<AsyncConfig>
) {
  const baseConfig: PoolConfig = {
    user: provider.getConfigVal("DB_USER"),
    database: provider.getConfigVal("DB_NAME"),
    password: provider.getConfigVal("DB_PASSWORD"),
    host: provider.getConfigVal("DB_HOST"),
    port: toNumber(provider.getConfigVal("DB_PORT", "5432")),
    max: toNumber(provider.getConfigVal("DB_POOL_MAX_CLIENTS", "10")),
    idleTimeoutMillis: toNumber(
      provider.getConfigVal("DB_CLIENT_TIMEOUT", "3000")
    ),
    connectionTimeoutMillis: toNumber(
      provider.getConfigVal("DB_CLIENT_CONNECT_TIMEOUT", "5000")
    ),
  };

  const poolPromise = asyncConfig.then((config) => {
    const connectionInfo = config[DATABASE_CONNECTION_INFO];
    return makePool(provider.logger, { ...baseConfig, ...connectionInfo });
  });

  const clientProvider = {
    getClient: async () => {
      const pool = await poolPromise;
      return pool.connect();
    },
    close: async () => {
      const pool = await poolPromise;
      return pool.end();
    },
  };

  provider.logger.debug("databaseInit complete");

  return {
    database: new Database(provider.logger, clientProvider),
    databaseClientProvider: clientProvider,
  };
}
