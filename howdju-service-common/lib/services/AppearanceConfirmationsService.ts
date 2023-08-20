import { Moment } from "moment";

import {
  AppearanceConfirmationStatus,
  CreateAppearanceConfirmation,
  EntityId,
  utcNow,
} from "howdju-common";

import {
  AppearanceConfirmationsDao,
  confirmationStatusPolarityToStatus,
} from "../daos";
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
    // TODO read overlapping confirmation. If same polarity, do nothing. If different polarity,
    // delete it and re-create.
    await this.appearanceConfirmationsDao.createAppearanceConfirmation(
      createAppearanceConfirmation,
      userId,
      createdAt
    );
    return confirmationStatusPolarityToStatus(
      createAppearanceConfirmation.polarity
    );
  }

  readAppearanceConfirmationStatusesForAppearanceIds(
    userId: EntityId,
    appearanceIds: string[]
  ): Promise<
    {
      appearanceId: EntityId;
      confirmationStatus: AppearanceConfirmationStatus;
    }[]
  > {
    return this.appearanceConfirmationsDao.readAppearanceConfirmationStatusesForAppearanceIds(
      userId,
      appearanceIds
    );
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
