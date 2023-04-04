import map from "lodash/map";
import Promise from "bluebird";
import { Database } from "..";
import { QueryResultRow } from "pg";

const emptyResults = Promise.resolve([]);

export class TextSearcher<Row, Data> {
  database: Database;
  tableName: string;
  textColumnName: string;
  rowMapper: (row: Row | undefined) => Data | undefined;
  dedupColumnName: string;
  searchFullTextPhraseQuery: string;
  searchFullTextPlainQuery: string;
  searchContainingTextQuery: string;

  constructor(
    database: Database,
    tableName: string,
    textColumnName: string,
    rowMapper: (row: Row | undefined) => Data | undefined,
    dedupColumnName: string
  ) {
    this.database = database;
    this.tableName = tableName;
    this.textColumnName = textColumnName;
    this.rowMapper = rowMapper;
    this.dedupColumnName = dedupColumnName;

    this.searchFullTextPhraseQuery = makeSearchFullTextPhraseQuery(
      tableName,
      textColumnName
    );
    this.searchFullTextPlainQuery = makeSearchFullTextPlainQuery(
      tableName,
      textColumnName
    );
    this.searchContainingTextQuery = makeSearchContainingTextQuery(
      tableName,
      textColumnName
    );
  }

  async search(searchText: string) {
    if (!searchText) {
      return emptyResults;
    }
    const normalSearchText = normalizeSearchText(searchText);
    if (normalSearchText === "") {
      return emptyResults;
    }
    /* Search methodology:
     *   search by phrase (words next to each other) [phraseto_tsquery]
     *   then for rows matching all words, [plainto_tsquery]
     *   then by any words, [to_tsquery]
     *   then by any rows that contain the text [ilike]
     * Combine in order, removing duplicate rows.
     */
    const searchTextWords = normalSearchText.split(/\s+/);
    const tsqueryParts = map(
      searchTextWords,
      (_w, i) => `to_tsquery('english', $${i + 1})`
    );
    const tsquery = tsqueryParts.join(" || ");
    const [
      { rows: phraseRows },
      { rows: plainRows },
      { rows: rawRows },
      { rows: containingRows },
    ] = await this.database.queries([
      {
        queryName: "searchFullTextPhraseQuery",
        sql: this.searchFullTextPhraseQuery,
        args: [normalSearchText],
      },
      {
        queryName: "searchFullTextPlainQuery",
        sql: this.searchFullTextPlainQuery,
        args: [normalSearchText],
      },
      {
        queryName: "searchFullTextRawQuery",
        sql: makeSearchFullTextRawQuery(
          this.tableName,
          this.textColumnName,
          tsquery
        ),
        args: searchTextWords,
      },
      {
        queryName: "searchContainingTextQuery",
        sql: this.searchContainingTextQuery,
        args: [normalSearchText],
      },
    ]);
    const uniqueRows = removeDups(
      this.dedupColumnName,
      phraseRows,
      plainRows,
      rawRows,
      containingRows
    );
    return map(uniqueRows, this.rowMapper);
  }
}

function removeDups(idName: string, ...rowsArr: QueryResultRow[][]) {
  const seenIds = new Set();
  const deduped = [];
  for (const rows of rowsArr) {
    for (const row of rows) {
      const id: string = row[idName];
      if (!seenIds.has(id)) {
        deduped.push(row);
        seenIds.add(id);
      }
    }
  }
  return deduped;
}

function normalizeSearchText(searchText: string) {
  let normalSearchText = searchText;
  // remove non-word/non-space characters
  normalSearchText = normalSearchText.replace(/[^\w\s]/g, "");
  // normalize space
  normalSearchText = normalSearchText.replace(/\s+/g, " ");
  return normalSearchText;
}

function makeSearchFullTextPhraseQuery(
  tableName: string,
  textColumnName: string
) {
  return `
    with
      results as (
        select
            t.*
          , ts_rank_cd(vector, query) as rank
        from
          ${tableName} t,
          phraseto_tsquery('english', $1) as query,
          to_tsvector('english', ${textColumnName}) as vector
        where
              query @@ vector
          and deleted is null
      )
    select * from results order by rank desc
    `;
}

function makeSearchFullTextPlainQuery(
  tableName: string,
  textColumnName: string
) {
  return `
    with
      results as (
        select
            t.*
          , ts_rank_cd(vector, query) as rank
        from
          ${tableName} t,
          plainto_tsquery('english', $1) as query,
          to_tsvector('english', ${textColumnName}) as vector
        where
              query @@ vector
          and deleted is null
      )
    select * from results order by rank desc
    `;
}

function makeSearchFullTextRawQuery(
  tableName: string,
  textColumnName: string,
  tsquery: string
) {
  return `
    with
      results as (
        select
            t.*
          , ts_rank_cd(vector, ${tsquery}) as rank
        from
          ${tableName} t,
          to_tsvector('english', ${textColumnName}) as vector
        where
              (${tsquery}) @@ vector
          and deleted is null
      )
    select * from results order by rank desc
    `;
}

function makeSearchContainingTextQuery(
  tableName: string,
  textColumnName: string
) {
  return `
    select *
    from ${tableName}
    where
          ${textColumnName} ilike '%' || $1 || '%'
      and deleted is null
  `;
}
