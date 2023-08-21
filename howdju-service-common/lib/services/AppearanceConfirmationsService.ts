import { Moment } from "moment";

import {
  AppearanceConfirmationPolarity,
  AppearanceConfirmationStatus,
  CreateAppearanceConfirmation,
  EntityId,
  utcNow,
} from "howdju-common";

import { AppearanceConfirmationsDao } from "../daos";
import { AuthService } from "./AuthService";
import { UserIdent } from "./types";

export class AppearanceConfirmationsService {
  constructor(
    private readonly authService: AuthService,
    private readonly appearanceConfirmationsDao: AppearanceConfirmationsDao
  ) {}

  async createAppearanceConfirmation(
    userIdent: UserIdent,
    createAppearanceConfirmation: CreateAppearanceConfirmation,
    createdAt: Moment = utcNow()
  ) {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);
    const existingConfirmation =
      await this.appearanceConfirmationsDao.readAppearanceConfirmationForAppearanceId(
        userId,
        createAppearanceConfirmation.appearanceId
      );
    if (existingConfirmation) {
      if (
        existingConfirmation.polarity === createAppearanceConfirmation.polarity
      ) {
        return confirmationStatusPolarityToStatus(
          existingConfirmation.polarity
        );
      }
      await this.appearanceConfirmationsDao.deleteAppearanceConfirmation(
        userId,
        createAppearanceConfirmation.appearanceId,
        createdAt
      );
    }

    await this.appearanceConfirmationsDao.createAppearanceConfirmation(
      createAppearanceConfirmation,
      userId,
      createdAt
    );
    return confirmationStatusPolarityToStatus(
      createAppearanceConfirmation.polarity
    );
  }

  async readAppearanceConfirmationStatusesForAppearanceIds(
    userId: EntityId,
    appearanceIds: string[]
  ): Promise<
    {
      appearanceId: EntityId;
      confirmationStatus: AppearanceConfirmationStatus;
    }[]
  > {
    const appearanceConfirmations =
      await this.appearanceConfirmationsDao.readAppearanceConfirmationsForAppearanceIds(
        userId,
        appearanceIds
      );

    const statuses = [] as {
      appearanceId: string;
      confirmationStatus: AppearanceConfirmationStatus;
    }[];
    const remainingIds = new Set(appearanceIds);
    appearanceConfirmations.forEach(({ appearanceId, polarity }) => {
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

  async deleteAppearanceConfirmation(
    userIdent: UserIdent,
    appearanceId: EntityId
  ) {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);
    const deletedAt = utcNow();
    return this.appearanceConfirmationsDao.deleteAppearanceConfirmation(
      userId,
      appearanceId,
      deletedAt
    );
  }
}

export function confirmationStatusPolarityToStatus(
  polarity: AppearanceConfirmationPolarity
): AppearanceConfirmationStatus {
  return polarity === "POSITIVE" ? "CONFIRMED" : "DISCONFIRMED";
}
