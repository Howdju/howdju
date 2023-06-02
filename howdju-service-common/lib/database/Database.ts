import { Pool, QueryResultRow } from "pg";
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

export class Database {
  logger: Logger;
  pool: Pool;
  constructor(logger: Logger, pool: Pool) {
    this.logger = logger;
    this.pool = pool;
  }

  async query<R extends QueryResultRow>(
    queryName: string,
    sql: string,
    args?: any[],
    doArrayMode = false
  ) {
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
    try {
      const result = await this.pool.query<R>(config);
      result.rows = mapValuesDeep(result.rows, (v) =>
        v === null ? undefined : v
      );
      if (process.env.DEBUG_PRINT_DB_QUERIES) {
        this.logger.silly(`Database result: ${toJson(result)}`);
      }
      return result;
    } catch (err) {
      this.logger.error("Database.query error", {
        err,
        queryName,
        sql,
        utcArgs,
      });
      throw err;
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
