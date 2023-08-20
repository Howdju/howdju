import { Moment } from "moment";

import { CreateAppearanceConfirmation, EntityId } from "howdju-common";

import { Database } from "../database";

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
}
