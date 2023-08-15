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

  async readAppearanceForId(appearanceId: string) {
    const [appearance] = await this.readAppearanceForIds([appearanceId]);
    return appearance;
  }

  async readAppearanceForIds(appearanceIds: EntityId[]) {
    const { rows } = await this.database.query(
      `readAppearanceForId`,
      `select appearance_id, media_excerpt_id, proposition_id, creator_user_id, created
       from appearances
       where appearance_id = any($1)
         and deleted is null`,
      [appearanceIds]
    );
    return rows.map((row) => ({
      id: toIdString(row.appearance_id),
      mediaExcerptId: toIdString(row.media_excerpt_id),
      propositionId: toIdString(row.proposition_id),
      creatorUserId: toIdString(row.creator_user_id),
      created: row.created,
    }));
  }

  async readOverlappingAppearanceIdsForUsers(
    userIds: EntityId[],
    urlIds: EntityId[],
    sourceIds: EntityId[]
  ) {
    const { rows } = await this.database.query(
      "readOverlappingMediaExcerptIdsForUsers",
      `
      select
        appearance_id
      from
        appearances a
        join media_excerpts me using (media_excerpt_id)
        join url_locators ul using (media_excerpt_id)
        join urls u using (url_id)
        join media_excerpt_citations mec using (media_excerpt_id)
        join sources s using (source_id)
        join appearance_confirmations ac using (appearance_id)
      where
        a.deleted is null
        and me.deleted is null
        and ul.deleted is null
        and u.deleted is null
        and mec.deleted is null
        and s.deleted is null
        and av.deleted is null
        and url_id = any($2)
        and source_id = any($3)
        and ac.user_id = any($1)
      `,
      [userIds, urlIds, sourceIds]
    );
    return rows.map((row) => toIdString(row.appearance_id));
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
