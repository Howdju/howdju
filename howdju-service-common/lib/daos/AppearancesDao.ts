import { EntityId } from "howdju-common";
import { Moment } from "moment";
import { Database } from "..";
import { toIdString } from "./daosUtil";

export class AppearancesDao {
  constructor(private readonly database: Database) {}

  async createAppearanceReturningId(
    creatorUserId: EntityId,
    mediaExcerptId: EntityId,
    { propositionId }: { propositionId?: EntityId },
    createdAt: Moment
  ) {
    const {
      rows: [{ appearance_id }],
    } = await this.database.query(
      `createAppearance`,
      `insert into appearances (media_excerpt_id, proposition_id, creator_user_id, created)
       values ($1, $2, $3, $4)
       returning appearance_id`,
      [mediaExcerptId, propositionId, creatorUserId, createdAt]
    );
    return toIdString(appearance_id);
  }

  async readAppearanceForId(id: string) {
    const {
      rows: [row],
    } = await this.database.query(
      `readAppearanceForId`,
      `select appearance_id, media_excerpt_id, proposition_id, creator_user_id, created
       from appearances
       where appearance_id = $1
         and deleted is null`,
      [id]
    );
    if (!row) {
      return undefined;
    }
    return {
      id: toIdString(row.appearance_id),
      mediaExcerptId: toIdString(row.media_excerpt_id),
      propositionId: toIdString(row.proposition_id),
      creatorUserId: toIdString(row.creator_user_id),
      created: row.created,
    };
  }

  async readEquivalentAppearanceId(
    userId: string,
    mediaExcerptId: string,
    { propositionId }: { propositionId: string }
  ) {
    const {
      rows: [row],
    } = await this.database.query(
      `readEquivalentAppearance`,
      `select appearance_id
       from appearances
       where media_excerpt_id = $1
         and proposition_id = $2
         and creator_user_id = $3
         and deleted is null`,
      [mediaExcerptId, propositionId, userId]
    );
    if (!row) {
      return undefined;
    }
    return toIdString(row.appearance_id);
  }
}
