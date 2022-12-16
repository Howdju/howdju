import { readFileSync } from "fs";
import { PoolConfig } from "pg";

import { mockLogger } from "howdju-test-common";

import { makePool } from "..";

/** Drop and recreate the API DB for tests. */
export async function initDb(config: PoolConfig) {
  const { database: dbname, ...ddlConfig } = config;
  // This pool does not connect to the DB, so it will work even if the DB doesn't exist, which it
  // shouldn't with a fresh server.
  const noDbPool = makePool(mockLogger, ddlConfig);
  await noDbPool.query(`DROP DATABASE IF EXISTS ${dbname};`);
  await noDbPool.query(`CREATE DATABASE ${dbname};`);
  noDbPool.end();

  // This pool connects to the database.
  const dbPool = makePool(mockLogger, config);
  const ddl = readFileSync("./test-data/premiser_test_schema_dump.sql", {
    encoding: "utf8",
    flag: "r",
  });
  await dbPool.query(ddl);
  dbPool.end();
}
