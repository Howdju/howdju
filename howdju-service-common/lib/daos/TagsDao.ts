import { Moment } from "moment";

import {
  cleanWhitespace,
  CreateTag,
  EntityId,
  Logger,
  TagOut,
} from "howdju-common";

import { Database } from "../database";
import { mapSingle, mapMany, normalizeText } from "./daosUtil";
import { toTag } from "./orm";

export class TagsDao {
  constructor(private logger: Logger, private database: Database) {}

  async createTag(
    userId: EntityId,
    tag: CreateTag,
    now: Moment
  ): Promise<TagOut> {
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
    return toTag(row) as TagOut;
  }

  readTagForId(tagId: EntityId): Promise<TagOut | undefined> {
    return this.database
      .query(
        "readTagForId",
        `select * from tags where tag_id = $1 and deleted is null`,
        [tagId]
      )
      .then(mapSingle(this.logger, toTag, "tags", { tagId }));
  }

  readAllTags() {
    return this.database
      .query(
        "readAllTags",
        `select * from tags where deleted is null order by name`
      )
      .then(mapMany(toTag));
  }

  readTagForName(tagName: string): Promise<TagOut | undefined> {
    return this.database
      .query(
        "readTagForName",
        `select * from tags where normal_name = $1 and deleted is null`,
        [normalizeText(tagName)]
      )
      .then(mapSingle(this.logger, toTag, "tags", { tagName }));
  }

  readTagsLikeName(tagName: string): Promise<TagOut[]> {
    return this.database
      .query(
        "readTagsLikeName",
        `select *
      from tags
        where normal_name ilike '%' || $1 || '%' and deleted is null
      order by length(name), name`,
        [normalizeText(tagName)]
      )
      .then(mapMany(toTag));
  }
}
