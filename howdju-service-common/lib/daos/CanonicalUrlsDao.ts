import { Moment } from "moment";

import { Database } from "../database";

export class CanonicalUrlsDao {
  constructor(private readonly database: Database) {}

  create(url: string, canonicalUrl: string | undefined, retrievedAt: Moment) {
    return this.database.query(
      "CanonicalUrlsDao.create",
      `insert into canonical_url_confirmations (url, canonical_url, retrieved_at) values ($1, $2, $3)`,
      [url, canonicalUrl, retrievedAt]
    );
  }

  async read(url: string) {
    const {
      rows: [row],
    } = await this.database.query(
      "CanonicalUrlsDao.read",
      `
      select canonical_url
      from canonical_url_confirmations
        where url = $1 and canonical_url is not null
      order by retrieved_at desc
      limit 1`,
      [url]
    );
    if (!row) {
      return undefined;
    }
    return row.canonical_url;
  }
}
