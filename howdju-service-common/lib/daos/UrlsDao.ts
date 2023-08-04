import { Moment } from "moment";
import { QueryResultRow } from "pg";
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
  isDefined,
} from "howdju-common";

import { toUrl } from "./orm";
import { Database } from "../database";
import { toIdString } from "./daosUtil";

export class UrlsDao {
  private logger: Logger;
  private database: Database;

  constructor(logger: Logger, database: Database) {
    this.logger = logger;
    this.database = database;
  }

  async readUrlForUrl(url: string) {
    const {
      rows: [row],
    } = await this.database.query(
      "readUrlForUrl",
      "select url_id from urls where url = $1 and deleted is null",
      [url]
    );
    if (!row) {
      return undefined;
    }
    return this.readUrlForId(row.url_id);
  }

  async readUrlForId(id: EntityId) {
    const {
      rows: [row],
    } = await this.database.query(
      "readUrlsForIds",
      "select * from urls where url_id = $1 and deleted is null",
      [id]
    );
    if (!row) {
      return undefined;
    }
    return {
      id: toIdString(row.url_id),
      url: row.url,
      canonicalUrl: row.canonical_url,
      creatorUserId: toIdString(row.creator_user_id),
      created: row.created,
    };
  }

  async readUrlsForIds(ids: EntityId[]) {
    const urls = await Promise.all(ids.map((id) => this.readUrlForId(id)));
    return urls.filter(isDefined);
  }

  async readUrlsForCanonicalUrl(canonicalUrl: string) {
    const { rows } = await this.database.query(
      "readForCanonicalUrl",
      `select url_id from urls where canonical_url = $1 and deleted is null order by created asc`,
      [canonicalUrl]
    );
    return this.readUrlsForIds(rows.map((row) => row.url_id));
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

  async createUrl(url: CreateUrl, userId: EntityId, now: Moment) {
    const {
      rows: [row],
    } = await this.database.query(
      "createUrl",
      `
        insert into urls (url, canonical_url, creator_user_id, created)
        values ($1, $2, $3, $4)
        returning *
        `,
      [url.url, url.canonicalUrl, userId, now]
    );
    return {
      id: toIdString(row.url_id),
      url: row.url,
      canonicalUrl: row.canonical_url,
      creatorUserId: toIdString(row.creator_user_id),
      created: row.created,
    };
  }

  setCanonicalUrlForId(urlId: string, canonicalUrl: string) {
    return this.database.query(
      "setCanonicalUrlForId",
      `update urls set canonical_url = $2 where url_id = $1`,
      [urlId, canonicalUrl]
    );
  }

  deleteUrlForId(urlId: EntityId, deletedAt: Moment) {
    return this.database.query(
      "deleteUrlForId",
      `
        update urls
        set deleted = $2
        where url_id = $1 and deleted is null
        `,
      [urlId, deletedAt]
    );
  }
}
