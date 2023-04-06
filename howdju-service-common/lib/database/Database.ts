import moment from "moment";
import isDate from "lodash/isDate";
import map from "lodash/map";

import { timestampFormatString, requireArgs, Logger } from "howdju-common";
import { Pool, QueryResultRow } from "pg";

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

  query<R extends QueryResultRow>(
    queryName: string,
    sql: string,
    args?: any[],
    doArrayMode = false
  ) {
    requireArgs({ queryName, sql });

    const utcArgs = map(args, toUtc);
    this.logger.silly("Database.query", { queryName, sql, utcArgs });
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
    return this.pool.query<R>(config);
  }

  queries(queryAndArgs: { queryName: string; sql: string; args: any[] }[]) {
    return Promise.all(
      map(queryAndArgs, ({ queryName, sql, args }) =>
        this.query(queryName, sql, args)
      )
    );
  }
}
