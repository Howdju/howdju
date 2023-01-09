import concat from "lodash/concat";
import forEach from "lodash/forEach";
import head from "lodash/head";
import isNumber from "lodash/isNumber";
import join from "lodash/join";
import map from "lodash/map";
import toNumber from "lodash/toNumber";

import {
  assert,
  JustificationTargetTypes,
  newProgrammingError,
  idEqual,
  newImpossibleError,
  Logger,
  EntityId,
  JustificationRootTargetType,
} from "howdju-common";
import { QueryResultRow } from "pg";
import { JustificationRow, EntityRowId } from "./types";
import { toString } from "lodash";

// Convenience re-export. TODO update deps in this folder to depend on new location directly
export { normalizeText } from "howdju-common";

export type RowMapper<T extends QueryResultRow, R = any> = (row?: T) => R;
type MapSingleReturn<T extends QueryResultRow, M extends RowMapper<T>> = ({
  rows,
}: {
  rows: T[];
}) => ReturnType<M>;
export function mapSingle<T extends QueryResultRow, M extends RowMapper<T>>(
  mapper: M
): MapSingleReturn<T, M>;
export function mapSingle<T extends QueryResultRow, M extends RowMapper<T>>(
  loggerOrMapper: Logger | M,
  mapper?: M,
  tableName?: string,
  identifiers?: Record<string, string>
): MapSingleReturn<T, M> {
  return ({ rows }: { rows: T[] }) => {
    // Some queries, such as insert, have no chance for returning multiple rows.  So then the caller doesnt' pass the logger
    let requireOne = false;
    let logger: Logger | undefined = undefined;
    if (!mapper) {
      mapper = loggerOrMapper as M;
      requireOne = true;
    } else {
      logger = loggerOrMapper as Logger;
    }

    if (logger && rows.length > 1) {
      const identifiersString = join(
        map(identifiers, (val, key) => `${key} ${val}`),
        ", "
      );
      logger.warn(
        `Multiple (${rows.length}) ${tableName} for ${identifiersString}`
      );
    }

    const row = head(rows);
    if (requireOne && !row) {
      throw newImpossibleError("Missing required row");
    }
    return mapper(row);
  };
}

export const mapMany =
  <T extends QueryResultRow, M extends RowMapper<T>>(mapper: M) =>
  ({ rows }: { rows: T[] }) =>
    map(rows, mapper);

export const mapManyById =
  <
    T extends QueryResultRow,
    R extends { id: EntityId },
    M extends RowMapper<T, R>
  >(
    mapper: M
  ) =>
  ({ rows }: { rows: T[] }) => {
    const byId: Record<EntityId, R> = {};
    forEach(rows, (row) => {
      const entity = mapper(row);
      byId[entity.id] = entity;
    });
    return byId;
  };

export const groupRootJustifications = (
  rootTargetType: JustificationRootTargetType,
  rootTargetId: EntityId,
  justification_rows: JustificationRow[]
) => {
  const rootJustifications = [],
    counterJustificationsByJustificationId: Record<
      EntityRowId,
      JustificationRow[]
    > = {};
  for (const justification_row of justification_rows) {
    // There are two types of justifications: those targeting other justifications or those targeting the current root
    if (
      justification_row.target_type === JustificationTargetTypes.JUSTIFICATION
    ) {
      assert(
        () =>
          justification_row.target_type ===
          JustificationTargetTypes.JUSTIFICATION
      );
      if (
        !Object.prototype.hasOwnProperty.call(
          counterJustificationsByJustificationId,
          justification_row.target_id
        )
      ) {
        counterJustificationsByJustificationId[justification_row.target_id] =
          [];
      }
      counterJustificationsByJustificationId[justification_row.target_id].push(
        justification_row
      );
    } else {
      assert(() => justification_row.root_target_type === rootTargetType);
      assert(() => justification_row.target_type === rootTargetType);
      assert(() =>
        idEqual(toString(justification_row.target_id), rootTargetId)
      );
      rootJustifications.push(justification_row);
    }
  }
  return {
    rootJustifications,
    counterJustificationsByJustificationId,
  };
};

/** Renumber the SQL arguments starting from after {@link after} */
export const renumberSqlArgs = (sql: string, after: number): string => {
  if (!isNumber(after) || after < 0) {
    throw newProgrammingError("after must be a non-negative number");
  }
  if (after === 0) {
    // Nothing to do
    return sql;
  }

  const renumberedSql = sql.replace(/\$(\d+)/g, (_match, paramNumber) => {
    const paramNumberNumber = toNumber(paramNumber);
    const paramRenumber = paramNumberNumber + after;
    return `$${paramRenumber}`;
  });

  return renumberedSql;
};

export const addArrayParams = function addArrayParams(
  baseArgs: any[],
  values: any[]
) {
  const params: string[] = [];
  const start = baseArgs.length + 1;
  for (let i = 0; i < values.length; i++) {
    params.push("$" + (i + start));
  }
  return {
    params,
    args: concat(baseArgs, values),
  };
};

export const createParams = function createParams(
  count: number,
  start: number
) {
  return map(Array.from(Array(count).keys()), (i) => "$" + (i + start));
};
