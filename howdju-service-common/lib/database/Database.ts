import { PoolClient, QueryResultRow, QueryResult } from "pg";
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

/** An interface exposed to transcations to run queries. */
export interface TxnClient {
  query<R extends QueryResultRow>(
    queryName: string,
    sql: string,
    args?: any[],
    doArrayMode?: boolean
  ): Promise<QueryResult<R>>;
}

export interface PoolClientProvider {
  /** gets a connected client from the provider's pool. */
  getClient(): Promise<PoolClient>;
  /** ends the provider's pool. */
  close(): Promise<void>;
}

export class Database {
  constructor(
    private logger: Logger,
    private clientProvider: PoolClientProvider
  ) {}

  private async getClient() {
    return this.clientProvider.getClient();
  }

  private async queryClient<R extends QueryResultRow>(
    client: PoolClient,
    queryName: string,
    sql: string,
    args?: any[],
    doArrayMode = false
  ): Promise<QueryResult<R>> {
    requireArgs({ queryName, sql });

    const utcArgs = map(args, toUtc);
    if (process.env.DEBUG_PRINT_DB_QUERIES) {
      this.logger.silly(
        `Database query: ${toJson({ queryName, sql, utcArgs })}`
      );
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
      this.logger.error(`Query ${queryName} failed: ${e}`);
      throw e;
    }
    result.rows = mapValuesDeep(result.rows, (v) =>
      v === null ? undefined : v
    );
    // TODO(481) detect duplicate fields. Error in dev and log an error in prod.
    if (process.env.DEBUG_PRINT_DB_QUERIES) {
      const dbResult = omit(result, ["fields", "_parsers", "_types"]);
      this.logger.silly(`Database result: ${toJson({ queryName, dbResult })}`);
    }
    return result;
  }

  async transaction<R>(
    txnName: string,
    isolationLevel: IsolationLevel,
    isolationMode: IsolationMode,
    callback: (client: TxnClient) => Promise<R>
  ): Promise<R> {
    const client = await this.getClient();
    try {
      await this.queryClient(client, `txn.${txnName}.begin`, "begin");
      await this.queryClient(
        client,
        `txn.${txnName}.isolation`,
        `set transaction isolation level ${isolationLevel} ${isolationMode}`
      );
      const queryClient = this.queryClient.bind(this);
      const res = await callback({
        query(queryName, sql, args, doArrayMode) {
          return queryClient(client, queryName, sql, args, doArrayMode);
        },
      });
      await this.queryClient(client, `txn.${txnName}.commit`, "commit");
      return res;
    } catch (e) {
      // When Jest logs node-postgres DatabaseErrors, it doesn't show the stack trace, so we log it here.
      // TODO(457) remove this log-and-rethrow
      this.logger.error(`Transaction ${txnName} failed: ${e}`);
      await this.queryClient(client, `txn.${txnName}.rollback`, "rollback");
      throw e;
    } finally {
      client.release();
    }
  }

  async query<R extends QueryResultRow>(
    queryName: string,
    sql: string,
    args?: any[],
    doArrayMode = false
  ) {
    const client = await this.getClient();
    try {
      return await this.queryClient<R>(
        client,
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
