import { randomBytes } from "crypto";
import { readFileSync } from "fs";
import { PoolConfig } from "pg";

import { mockLogger } from "howdju-test-common";

import { ApiConfig, baseConfig, makePool } from "..";
import { logger } from "howdju-common";
import { cloneDeep, toNumber } from "lodash";

export function makeTestDbConfig() {
  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: toNumber(process.env.DB_PORT),
    max: toNumber(process.env.DB_MAX_CONNECTIONS),
  };
}

export function makeTestApiConfig(): ApiConfig {
  return cloneDeep(baseConfig);
}

/** Create a randomly named test DB. */
export async function initDb(config: PoolConfig) {
  if (config.database) {
    throw new Error(
      "Must not specify a test database name as it must be randomly generated."
    );
  }

  // This pool does not connect to the DB, so it will work even if the DB doesn't exist, which it
  // shouldn't with a fresh server.
  const noDbPool = makePool(mockLogger, config);
  let dbName;
  let succeeded = false;
  let attempts = 0;
  while (!succeeded && attempts < 10) {
    dbName = randomDbName();
    try {
      await noDbPool.query(`CREATE DATABASE ${dbName};`);
      logger.info(`Successfully created test DB ${dbName}`);
      succeeded = true;
    } catch {
      logger.info(
        `Failed to create test DB ${dbName}. Assuming it already exists and retrying a different name.`
      );
    }
    attempts++;
  }
  noDbPool.end();
  if (!succeeded) {
    throw new Error("Failed to create a test database.");
  }

  // This pool connects to the database.
  const dbPool = makePool(mockLogger, { ...config, database: dbName });
  const ddl = readFileSync("./test-data/premiser_test_schema_dump.sql", {
    encoding: "utf8",
    flag: "r",
  });
  await dbPool.query(ddl);
  dbPool.end();

  return dbName as string;
}

export async function dropDb(config: PoolConfig, dbName: string) {
  if (config.database) {
    throw new Error(
      "Must not specify a test database name as it must be randomly generated."
    );
  }
  const pool = makePool(mockLogger, config);
  await pool.query(`DROP DATABASE IF EXISTS ${dbName};`);
  pool.end();
}

function randomDbName() {
  return "howdju_" + randomBytes(20).toString("hex");
}
