import { keyBy, merge, toString, uniq } from "lodash";
import { Moment } from "moment";

import {
  CreateSource,
  EntityId,
  normalizeText,
  SourceOut,
  UpdateSource,
} from "howdju-common";

import { Database } from "../database";
import { toSource } from "./orm";
import { SourceRow } from "./dataTypes";
import { UsersDao } from "./UsersDao";
import { toIdString } from "./daosUtil";

export class SourcesDao {
  constructor(private db: Database, private usersDao: UsersDao) {}

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
    const creator = await this.usersDao.readUserBlurbForId(creatorUserId);
    return merge({}, source, {
      id: row.source_id,
      normalDescription,
      creatorUserId,
      creator,
      created,
    });
  }

  async readSourcesForIds(sourceIds: EntityId[]) {
    const { rows } = await this.db.query<SourceRow>(
      "readSourcesForIds",
      `
      select *
      from sources
            where source_id = any($1)
        and deleted is null
      order by array_position($1, source_id)`,
      [sourceIds]
    );
    // Get the distinct user IDs, index them by their user ID, and then add them to the sources.
    const userIds = uniq(rows.map((r) => toIdString(r.creator_user_id)));
    const creators = await this.usersDao.readUserBlurbsForIds(userIds);
    const creatorsById = keyBy(creators, "id");
    return rows.map((r) => toSource(r, creatorsById[r.creator_user_id]));
  }

  async readSourceForId(sourceId: EntityId): Promise<SourceOut | undefined> {
    const [source] = await this.readSourcesForIds([sourceId]);
    return source;
  }

  async readEquivalentSource(
    source: CreateSource
  ): Promise<SourceOut | undefined> {
    const {
      rows: [row],
    } = await this.db.query<SourceRow>(
      "readEquivalentSource",
      `SELECT source_id FROM sources WHERE normal_description = $1`,
      [normalizeText(source.description)]
    );
    if (!row) {
      return undefined;
    }
    return this.readSourceForId(toString(row.source_id));
  }

  async updateSource(updateSource: UpdateSource) {
    const normalDescription = normalizeText(updateSource.description);
    await this.db.query(
      "updateSource",
      `
      update sources
      set description = $1, normal_description = $2
      where source_id = $3
      `,
      [updateSource.description, normalDescription, updateSource.id]
    );
    const source = await this.readSourceForId(updateSource.id);
    if (!source) {
      throw Error(`Source ${updateSource.id} not found after update.`);
    }
    return source;
  }

  async deleteSourceForId(sourceId: string, deletedAt: Moment) {
    await this.db.query(
      "deleteSourceForId",
      `
      update sources
      set deleted = $2
      where source_id = $1 and deleted is null
      `,
      [sourceId, deletedAt]
    );
  }
}
