import {
  requireArgs,
  cleanWhitespace,
  Logger,
  EntityId,
  CreateTag,
} from "howdju-common";

import { normalizeText } from "./daosUtil";
import { toTag } from "./orm";
import { Database } from "../database";

exports.TagsDao = class TagsDao {
  logger: Logger;
  database: Database;

  constructor(logger: Logger, database: Database) {
    requireArgs({ logger, database });
    this.logger = logger;
    this.database = database;
  }

  async createTag(userId: EntityId, tag: CreateTag, now: Date) {
    const {
      rows: [row],
    } = await this.database.query(
      "createTag",
      `
      insert into tags (name, normal_name, created, creator_user_id)
      values ($1, $2, $3, $4)
      returning *
      `,
      [cleanWhitespace(tag.name), normalizeText(tag.name), now, userId]
    );
    return toTag(row);
  }

  async readTagForId(tagId: EntityId) {
    const {
      rows: [row],
    } = await this.database.query(
      "readTagForId",
      `select * from tags where tag_id = $1 and deleted is null`,
      [tagId]
    );
    return toTag(row);
  }

  async readTagForName(tagName: string) {
    const {
      rows: [row],
    } = await this.database.query(
      "readTagForName",
      `select * from tags where normal_name = $1 and deleted is null`,
      [normalizeText(tagName)]
    );
    return toTag(row);
  }

  async readTagsLikeName(tagName: string) {
    const { rows } = await this.database.query(
      "readTagsLikeName",
      `select *
      from tags
        where normal_name ilike '%' || $1 || '%' and deleted is null
      order by length(name), name`,
      [normalizeText(tagName)]
    );
    return rows.map(toTag);
  }
};
