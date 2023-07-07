import { Pool, PoolClient, QueryResultRow, QueryResult } from "pg";
import moment from "moment";
import isDate from "lodash/isDate";
import map from "lodash/map";

import {
  timestampFormatString,
  requireArgs,
  Logger,
  mapValuesDeep,
  toJson,
} from "howdju-common";

const toUtc = (val: any) => {
  if (isDate(val)) {
    return moment.utc(val).format(timestampFormatString);
  }
  if (moment.isMoment(val)) {
    return val.utc().format(timestampFormatString);
  }

  return val;
};

export interface TxnClient {
  query<R extends QueryResultRow>(
    queryName: string,
    sql: string,
    args?: any[],
    doArrayMode?: boolean
  ): Promise<QueryResult<R>>;
}

class TxnClientProxy implements TxnClient {
  constructor(private client: PoolClient, private logger: Logger) {}
  query<R extends QueryResultRow>(
    queryName: string,
    sql: string,
    args?: any[],
    doArrayMode = false
  ): Promise<QueryResult<R>> {
    return doQuery<R>(
      this.client,
      this.logger,
      queryName,
      sql,
      args,
      doArrayMode
    );
  }
}

export class Database {
  logger: Logger;
  pool: Pool;
  constructor(logger: Logger, pool: Pool) {
    this.logger = logger;
    this.pool = pool;
  }

  async transaction(
    txnName: string,
    callback: (client: TxnClient) => Promise<any>
  ) {
    const pgClient = await this.pool.connect();
    const txnClient = new TxnClientProxy(pgClient, this.logger);
    try {
      if (process.env.DEBUG_PRINT_DB_QUERIES) {
        this.logger.silly(`Beginning transaction: ${toJson({ txnName })}`);
      }

      await pgClient.query("BEGIN");

      const res = await callback(txnClient);

      if (process.env.DEBUG_PRINT_DB_QUERIES) {
        this.logger.silly(`Committing transaction: ${toJson({ txnName })}`);
      }

      await pgClient.query("COMMIT");

      if (process.env.DEBUG_PRINT_DB_QUERIES) {
        this.logger.silly(`Committed transaction: ${toJson({ txnName })}`);
      }

      return res;
    } catch (e) {
      if (process.env.DEBUG_PRINT_DB_QUERIES) {
        this.logger.silly(
          `Rolling back transaction: ${toJson({ txnName, e })}`
        );
      }
      await pgClient.query("ROLLBACK");
      throw e;
    } finally {
      pgClient.release();
    }
  }

  async query<R extends QueryResultRow>(
    queryName: string,
    sql: string,
    args?: any[],
    doArrayMode = false
  ) {
    const client = await this.pool.connect();
    try {
      return await doQuery<R>(
        client,
        this.logger,
        queryName,
        sql,
        args,
        doArrayMode
      );
    } finally {
      client.release();
    }
  }

  queries(queryAndArgs: { queryName: string; sql: string; args: any[] }[]) {
    return Promise.all(
      map(queryAndArgs, ({ queryName, sql, args }) =>
        this.query(queryName, sql, args)
      )
    );
  }
}

async function doQuery<R extends QueryResultRow>(
  client: PoolClient,
  logger: Logger,
  queryName: string,
  sql: string,
  args?: any[],
  doArrayMode = false
): Promise<QueryResult<R>> {
  requireArgs({ queryName, sql });

  const utcArgs = map(args, toUtc);
  if (process.env.DEBUG_PRINT_DB_QUERIES) {
    logger.silly(`Database query: ${toJson({ queryName, sql, utcArgs })}`);
  }
  const config = doArrayMode
    ? {
        text: sql,
        values: utcArgs,
        rowMode: "array",
      }
    : {
        text: sql,
        values: utcArgs,
      };
  const result = await client.query<R>(config);
  result.rows = mapValuesDeep(result.rows, (v) => (v === null ? undefined : v));
  if (process.env.DEBUG_PRINT_DB_QUERIES) {
    logger.silly(`Database result: ${toJson({ queryName, result })}`);
  }
  return result;
}
