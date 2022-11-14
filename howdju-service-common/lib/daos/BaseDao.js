const forEach = require("lodash/forEach");
const head = require("lodash/head");
const map = require("lodash/map");

const { requireArgs, newImpossibleError } = require("howdju-common");

const START_PREFIX = "_prefix__";
const STOP_PREFIX = "_stop_prefix";

class BaseDao {
  constructor(logger, database, mapper) {
    requireArgs({ logger, database, mapper });
    this.logger = logger;
    this.database = database;
    this.mapper = mapper;
  }

  /** Executes a parameterized query, returning a single mapped row.  If no rows, that's an error.  If multiple rows, it returns the first */
  async queryOne(queryName, sql, args, isRequired = false) {
    const result = await this.database.query(queryName, sql, args, true);
    const { fields, rows } = result;

    if (rows.length > 1) {
      this.logger.warn(
        `queryOne found unexpected multiple rows (${rows.length}) for query ${queryName}`
      );
    }

    const row = head(rows);
    if (isRequired && !row) {
      throw newImpossibleError(`Missing required row for query ${queryName}`);
    }

    const rowObj = row && convertRowToObject(fields, row);

    return this.mapper(rowObj);
  }

  /** Executes a parameterized query, returning a single value from a single unmapped row.  If no rows or columns, that's an error.  If multiple rows or columns, it returns the first of each */
  async queryOneValue(queryName, sql, args) {
    const { rows } = await this.database.query(queryName, sql, args, true);

    if (rows.length > 1) {
      this.logger.warn(
        `queryOneValue found unexpected multiple rows (${rows.length}) for query ${queryName}`
      );
    }

    const row = head(rows);
    if (!row) {
      throw newImpossibleError(`Missing required row for query ${queryName}`);
    }

    if (row.length > 1) {
      this.logger.warn(
        `queryOneValue found unexpected multiple columns (${rows.length}) for query ${queryName}`
      );
    }
    if (row.length < 1) {
      throw newImpossibleError(
        `Missing required column for query ${queryName}`
      );
    }

    return row[0];
  }

  /** Executes a parameterized query, returning zero or more mapped rows. */
  async queryMany(queryName, sql, args) {
    const { fields, rows } = await this.database.query(
      queryName,
      sql,
      args,
      true
    );
    const prefixed = map(rows, (row) => convertRowToObject(fields, row));
    return map(prefixed, this.mapper);
  }

  /** Executes a parametrized query, returning the count of affected rows */
  async execute(queryName, sql, args) {
    const { rowCount } = await this.database.query(queryName, sql, args);
    return rowCount;
  }
}

/**
 * Converts a database array row to an object with keys defined by `fields`.
 * Adds a <prefix> to all fields that follow a (dummy) field with the name: START_PREFIX<prefix>
 */
function convertRowToObject(fields, row) {
  const rowObj = {};
  let prefix = null;
  forEach(fields, (field, i) => {
    const key = field.name;
    if (key.startsWith(START_PREFIX)) {
      if (row[i] !== "") {
        throw newImpossibleError(
          `START_PREFIX ${START_PREFIX} must not appear with a value, but had value: ${row[i]}`
        );
      }
      prefix = key.substr(START_PREFIX.length);
    } else if (key === STOP_PREFIX) {
      if (row[i] !== "") {
        throw newImpossibleError(
          `STOP_PREFIX ${STOP_PREFIX} must not appear with a value, but had value: ${row[i]}`
        );
      }
      prefix = null;
    } else if (prefix) {
      const prefixedKey = prefix + key;
      rowObj[prefixedKey] = row[i];
    } else {
      rowObj[key] = row[i];
    }
  });
  return rowObj;
}

module.exports = {
  convertRowToObject,
  BaseDao,
  START_PREFIX,
  STOP_PREFIX,
};
