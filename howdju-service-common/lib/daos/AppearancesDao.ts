import { EntityId } from "howdju-common";
import { Moment } from "moment";
import { Database } from "..";

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
      `insert into appearances (media_excerpt_id, proposition_id, creator_user_id, created_at)
       values ($1, $2, $3, $4)
       returning appearance_id`,
      [mediaExcerptId, propositionId, creatorUserId, createdAt]
    );
    return appearance_id;
  }

  async readEquivalentAppearanceId(
    userId: string,
    mediaExcerptId: string,
    { propositionId }: { propositionId: string }
  ) {
    const {
      rows: [{ appearance_id }],
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
    return appearance_id;
  }
}
