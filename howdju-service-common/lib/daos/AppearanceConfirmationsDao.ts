import { Moment } from "moment";

import {
  AppearanceConfirmationStatus,
  ConfirmationStatusPolarity,
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

  async readAppearanceConfirmationStatusesForAppearanceIds(
    userId: string,
    appearanceIds: string[]
  ): Promise<
    {
      appearanceId: string;
      confirmationStatus: AppearanceConfirmationStatus;
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

    const statuses = [] as {
      appearanceId: string;
      confirmationStatus: AppearanceConfirmationStatus;
    }[];
    const remainingIds = new Set(appearanceIds);
    rows.forEach(({ appearance_id, polarity }) => {
      const appearanceId = toIdString(appearance_id);
      remainingIds.delete(appearanceId);
      statuses.push({
        appearanceId,
        confirmationStatus: confirmationStatusPolarityToStatus(polarity),
      });
    });
    remainingIds.forEach((appearanceId) => {
      statuses.push({ appearanceId, confirmationStatus: undefined });
    });
    return statuses;
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

export function confirmationStatusPolarityToStatus(
  polarity: ConfirmationStatusPolarity
): AppearanceConfirmationStatus {
  return polarity === "POSITIVE" ? "CONFIRMED" : "DISCONFIRMED";
}
