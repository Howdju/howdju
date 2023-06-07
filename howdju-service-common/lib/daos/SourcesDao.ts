import { merge } from "lodash";
import { Moment } from "moment";

import {
  CreateSource,
  EntityId,
  normalizeText,
  SourceOut,
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
      `SELECT * FROM sources WHERE normal_description_apa = $1`,
      [normalizeText(source.descriptionApa)]
    );
    if (!row) {
      return undefined;
    }
    return toSource(row);
  }

  async createSource(
    creatorUserId: EntityId,
    source: CreateSource,
    created: Moment
  ) {
    const normalDescriptionApa = normalizeText(source.descriptionApa);
    const {
      rows: [row],
    } = await this.db.query(
      "createSource",
      `
      insert into sources (description_apa, normal_description_apa, creator_user_id, created)
      values ($1, $2, $3, $4)
      returning source_id
      `,
      [source.descriptionApa, normalDescriptionApa, creatorUserId, created]
    );
    return merge({}, source, {
      id: row.source_id,
      normalDescriptionApa,
      creatorUserId,
      created,
    });
  }
}
