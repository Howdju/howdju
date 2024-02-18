import map from "lodash/map";
import { QueryResultRow } from "pg";

import { AuthToken, EntityId } from "howdju-common";

import { Database } from "../database";
import { toIdString } from "../daos/daosUtil";

const emptyResults = Promise.resolve([]);

export class TextSearcher<Entity> {
  searchFullTextPhraseQuery: string;
  searchFullTextPlainQuery: string;
  searchContainingTextQuery: string;

  constructor(
    private database: Database,
    private tableName: string,
    private textColumnName: string,
    private entityReader: (
      authToken: AuthToken | undefined,
      ids: EntityId[]
    ) => Promise<Entity[]>,
    private idColumnName: string
  ) {
    this.searchFullTextPhraseQuery = makeSearchFullTextPhraseQuery(
      idColumnName,
      tableName,
      textColumnName
    );
    this.searchFullTextPlainQuery = makeSearchFullTextPlainQuery(
      idColumnName,
      tableName,
      textColumnName
    );
    this.searchContainingTextQuery = makeSearchContainingTextQuery(
      idColumnName,
      tableName,
      textColumnName
    );
  }

  async search(
    authToken: AuthToken | undefined,
    searchText: string
  ): Promise<Entity[]> {
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
          this.idColumnName,
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
    const uniqueIds = collectUniqueIds(
      this.idColumnName,
      phraseRows,
      plainRows,
      rawRows,
      containingRows
    );
    return this.entityReader(authToken, uniqueIds);
  }
}

function collectUniqueIds(
  idName: string,
  ...rowsArr: QueryResultRow[][]
): EntityId[] {
  const seenIds = new Set();
  const uniqueIds = [];
  for (const rows of rowsArr) {
    for (const row of rows) {
      const id = toIdString(row[idName]);
      if (!seenIds.has(id)) {
        uniqueIds.push(id);
        seenIds.add(id);
      }
    }
  }
  return uniqueIds;
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
  idColumnName: string,
  tableName: string,
  textColumnName: string
) {
  return `
    with
      results as (
        select
            t.${idColumnName}
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
  idColumnName: string,
  tableName: string,
  textColumnName: string
) {
  return `
    with
      results as (
        select
            t.${idColumnName}
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
  idColumnName: string,
  tableName: string,
  textColumnName: string,
  tsquery: string
) {
  return `
    with
      results as (
        select
            t.${idColumnName}
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
  idColumnName: string,
  tableName: string,
  textColumnName: string
) {
  return `
    select ${idColumnName}
    from ${tableName}
    where
          ${textColumnName} ilike '%' || $1 || '%'
      and deleted is null
  `;
}
