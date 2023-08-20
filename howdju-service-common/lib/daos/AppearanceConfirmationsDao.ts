import { Moment } from "moment";

import {
  AppearanceConfirmationPolarity,
  CreateAppearanceConfirmation,
  EntityId,
} from "howdju-common";

import { Database } from "../database";
import { toIdString } from "./daosUtil";

export class AppearanceConfirmationsDao {
  constructor(private readonly db: Database) {}

  createAppearanceConfirmation(
    { appearanceId, polarity }: CreateAppearanceConfirmation,
    userId: EntityId,
    createdAt: Moment
  ) {
    return this.db.query(
      "createAppearanceConfirmation",
      `
      insert into appearance_confirmations (appearance_id, user_id, polarity, created)
      values ($1, $2, $3, $4)
    `,
      [appearanceId, userId, polarity, createdAt]
    );
  }

  async readAppearanceConfirmationForAppearanceId(
    userId: EntityId,
    appearanceId: EntityId
  ) {
    const [confirmation] =
      await this.readAppearanceConfirmationsForAppearanceIds(userId, [
        appearanceId,
      ]);
    return confirmation;
  }

  async readAppearanceConfirmationsForAppearanceIds(
    userId: EntityId,
    appearanceIds: EntityId[]
  ): Promise<
    {
      appearanceId: EntityId;
      polarity: AppearanceConfirmationPolarity;
    }[]
  > {
    const { rows } = await this.db.query(
      "readAppearanceConfirmationStatusesForAppearanceIds",
      `
      select
          appearance_id
        , polarity
      from appearance_confirmations
      where
            user_id = $1
        and appearance_id = any($2)
        and deleted is null
    `,
      [userId, appearanceIds]
    );

    return rows.map(({ appearance_id, polarity }) => ({
      appearanceId: toIdString(appearance_id),
      polarity,
    }));
  }

  deleteAppearanceConfirmation(
    userId: EntityId,
    appearanceId: EntityId,
    deletedAt: Moment
  ) {
    return this.db.query(
      "deleteAppearanceConfirmation",
      `
      update appearance_confirmations
      set deleted = $3
      where
            user_id = $1
        and appearance_id = $2
    `,
      [userId, appearanceId, deletedAt]
    );
  }
}
