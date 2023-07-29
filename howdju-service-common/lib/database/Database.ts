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
import { omit } from "lodash";

export type IsolationLevel =
  | "serializable"
  | "repeatable read"
  | "read committed"
  | "read uncommitted";
export type IsolationMode = "read write" | "read only";

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
  constructor(private logger: Logger, private pool: Pool) {}

  async transaction<R>(
    txnName: string,
    isolationLevel: IsolationLevel,
    isolationMode: IsolationMode,
    callback: (client: TxnClient) => Promise<R>
  ): Promise<R> {
    const pgClient = await this.pool.connect();
    const txnClient = new TxnClientProxy(pgClient, this.logger);
    try {
      await txnClient.query(`txn.${txnName}.begin`, "begin");
      await txnClient.query(
        `txn.${txnName}.isolation`,
        `set transaction isolation level ${isolationLevel} ${isolationMode}`
      );
      const res = await callback(txnClient);
      await txnClient.query(`txn.${txnName}.commit`, "commit");
      return res;
    } catch (e) {
      // When Jest logs node-postgres DatabaseErrors, it doesn't show the stack trace, so we log it here.
      // TODO(457) remove this log-and-rethrow
      this.logger.error(`Transaction ${txnName} failed: ${e}`);
      await txnClient.query(`txn.${txnName}.rollback`, "rollback");
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
  let result;
  try {
    result = await client.query<R>(config);
  } catch (e) {
    // When Jest logs node-postgres DatabaseErrors, it doesn't show the stack trace, so we log it here.
    // TODO(457) remove this log-and-rethrow
    logger.error(`Query ${queryName} failed: ${e}`);
    throw e;
  }
  result.rows = mapValuesDeep(result.rows, (v) => (v === null ? undefined : v));
  // TODO(481) detect duplicate fields. Error in dev and log an error in prod.
  if (process.env.DEBUG_PRINT_DB_QUERIES) {
    const dbResult = omit(result, ["fields", "_parsers", "_types"]);
    logger.silly(`Database result: ${toJson({ queryName, dbResult })}`);
  }
  return result;
}
