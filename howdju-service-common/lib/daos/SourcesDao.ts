import { merge } from "lodash";
import { Moment } from "moment";

import {
  brandedParse,
  CreateSource,
  EntityId,
  normalizeText,
  SourceOut,
  SourceRef,
} from "howdju-common";

import { Database } from "../database";
import { toSource } from "./orm";
import { SourceRow } from "./dataTypes";

export class SourcesDao {
  private db: Database;
  constructor(db: Database) {
    this.db = db;
  }

  async readSourceForId(sourceId: EntityId): Promise<SourceOut | undefined> {
    const {
      rows: [row],
    } = await this.db.query<SourceRow>(
      "readSourceForId",
      `SELECT * FROM sources WHERE source_id = $1`,
      [normalizeText(sourceId)]
    );
    if (!row) {
      return undefined;
    }
    return toSource(row);
  }

  async readEquivalentSource(
    source: CreateSource
  ): Promise<SourceOut | undefined> {
    const {
      rows: [row],
    } = await this.db.query<SourceRow>(
      "readEquivalentSource",
      `SELECT * FROM sources WHERE normal_description = $1`,
      [normalizeText(source.description)]
    );
    if (!row) {
      return undefined;
    }
    return toSource(row);
  }

  async createSources(
    creatorUserId: EntityId,
    sources: CreateSource[],
    created: Moment
  ) {
    return Promise.all(
      sources.map((s) => this.createSource(creatorUserId, s, created))
    );
  }

  async createSource(
    creatorUserId: EntityId,
    source: CreateSource,
    created: Moment
  ) {
    const normalDescription = normalizeText(source.description);
    const {
      rows: [row],
    } = await this.db.query(
      "createSource",
      `
      insert into sources (description, normal_description, creator_user_id, created)
      values ($1, $2, $3, $4)
      returning source_id
      `,
      [source.description, normalDescription, creatorUserId, created]
    );
    return brandedParse(
      SourceRef,
      merge({}, source, {
        id: row.source_id,
        normalDescription,
        creatorUserId,
        created,
      })
    );
  }
}
