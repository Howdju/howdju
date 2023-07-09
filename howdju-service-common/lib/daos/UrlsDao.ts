import forEach from "lodash/forEach";
import map from "lodash/map";

import {
  JustificationBasisTypes,
  JustificationBasisCompoundAtomTypes,
  SourceExcerptTypes,
  Logger,
  EntityId,
  JustificationRootTargetType,
  CreateUrl,
  UrlOut,
} from "howdju-common";
import { toUrl } from "./orm";

import head from "lodash/head";
import { Database } from "../database";
import { Moment } from "moment";
import { QueryResultRow } from "pg";

export class UrlsDao {
  private logger: Logger;
  private database: Database;

  constructor(logger: Logger, database: Database) {
    this.logger = logger;
    this.database = database;
  }

  readUrlForUrl(url: string) {
    return this.database
      .query(
        "readUrlForUrl",
        "select * from urls where url = $1 and deleted is null",
        [url]
      )
      .then(({ rows }) => {
        if (rows.length > 1) {
          this.logger.error(`${rows.length} equivalent URLs`, { url });
        }
        return toUrl(head(rows));
      });
  }

  async readUrlForId(id: EntityId) {
    const {
      rows: [row],
    } = await this.database.query(
      "readUrlsForIds",
      "select * from urls where url_id = $1 and deleted is null",
      [id]
    );
    return toUrl(row);
  }

  async readUrlsForIds(ids: EntityId[]) {
    const { rows } = await this.database.query(
      "readUrlsForIds",
      "select * from urls where url_id in ($1) and deleted is null",
      [ids.join(",")]
    );
    return rows.map(toUrl);
  }

  readUrlsByWritQuoteIdForRootTarget(
    rootTargetType: JustificationRootTargetType,
    rootTargetId: EntityId
  ) {
    const sql = `
        select
            wq.writ_quote_id
          , u.url_id
          , u.url
        from justifications j
            join writ_quotes wq on
                  j.basis_type = $2
              and j.basis_id = wq.writ_quote_id
            join writ_quote_urls wqu using (writ_quote_id)
            join urls u USING (url_id)
          where
                j.root_target_type = $6
            and j.root_target_id = $1
            and j.deleted is null
            and wq.deleted is null
            and wqu.deleted is null
            and u.deleted is null

      union

        select
            wq.writ_quote_id
          , u.url_id
          , u.url
        from justifications j
            join justification_basis_compounds jbc on
                  j.basis_type = $3
              and j.basis_id = jbc.justification_basis_compound_id
            join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
            join source_excerpt_paraphrases sep on
                  jbca.entity_type = $4
              and jbca.entity_id = sep.source_excerpt_paraphrase_id
            join writ_quotes wq on
                  sep.source_excerpt_type = $5
              and sep.source_excerpt_id = wq.writ_quote_id
            join writ_quote_urls wqu using (writ_quote_id)

            join urls u USING (url_id)
          where
                j.root_target_type = $6
            and j.root_target_id = $1
            and j.deleted is null
            and jbc.deleted is null
            and sep.deleted is null
            and wq.deleted is null
            and wqu.deleted is null
            and u.deleted is null
    `;
    return this.database
      .query("readUrlsByWritQuoteIdForRootTarget", sql, [
        rootTargetId,
        JustificationBasisTypes.WRIT_QUOTE,
        JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND,
        JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE,
        SourceExcerptTypes.WRIT_QUOTE,
        rootTargetType,
      ])
      .then(({ rows }) => this.groupUrlsByWritQuoteId(rows));
  }

  private groupUrlsByWritQuoteId(rows: QueryResultRow[]) {
    const urlsByWritQuoteId = {} as Record<number, UrlOut[]>;
    forEach(rows, (row) => {
      let urls = urlsByWritQuoteId[row.writ_quote_id];
      if (!urls) {
        urlsByWritQuoteId[row.writ_quote_id] = urls = [];
      }
      const url = toUrl(row);
      if (!url) {
        this.logger.error(`Url row failed to map: ${row}`);
        return;
      }
      urls.push(url);
    });
    return urlsByWritQuoteId;
  }

  readDomains() {
    return this.database
      .query(
        "readDomains",
        `select distinct substring( url from '.*://([^/]*)' ) as domain from urls order by domain`
      )
      .then(({ rows }) => map(rows, (row) => row.domain));
  }

  createUrls(urls: CreateUrl[], userId: EntityId, created: Moment) {
    return Promise.all(
      map(urls, (url) => this.createUrl(url, userId, created))
    );
  }

  createUrl(url: CreateUrl, userId: EntityId, now: Moment) {
    const canonicalUrl = url.canonicalUrl || url.url;
    return this.database
      .query(
        "createUrl",
        `
        insert into urls (url, canonical_url, creator_user_id, created)
        values ($1, $2, $3, $4)
        returning *
        `,
        [url.url, canonicalUrl, userId, now]
      )
      .then(({ rows: [row] }) => toUrl(row));
  }
}
