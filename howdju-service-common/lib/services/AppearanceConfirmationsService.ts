import { Moment } from "moment";

import { CreateAppearanceConfirmation, utcNow } from "howdju-common";

import { AppearanceConfirmationsDao } from "../daos";
import { AuthService } from "./AuthService";
import { UserIdent } from "./types";

export class AppearanceConfirmationsService {
  constructor(
    private readonly authService: AuthService,
    private readonly appearanceConfirmationsDao: AppearanceConfirmationsDao
  ) {}

  async createAppearanceConfirmation(
    createAppearanceConfirmation: CreateAppearanceConfirmation,
    userIdent: UserIdent,
    createdAt: Moment = utcNow()
  ) {
    const userId = await this.authService.readUserIdForUserIdent(userIdent);
    // TODO read overlapping confirmation. If same polarity, do nothing. If different polarity,
    // delete it and re-create.
    return this.appearanceConfirmationsDao.createAppearanceConfirmation(
      createAppearanceConfirmation,
      userId,
      createdAt
    );
  }
}
