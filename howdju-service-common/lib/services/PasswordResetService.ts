import moment, { Duration, Moment } from "moment";
import outdent from "outdent";

import {
  commonPaths,
  CreatePasswordResetRequest,
  DurationDisplayInfo,
  EntityTypes,
  Logger,
  momentAdd,
  newImpossibleError,
  PasswordResetConfirmation,
  PasswordResetRequest,
  TopicMessageSender,
  utcNow,
} from "howdju-common";

import {
  EntityNotFoundError,
  PasswordResetAlreadyConsumedError,
  PasswordResetExpiredError,
} from "../serviceErrors";
import { randomBase64String } from "../crypto";
import { ApiConfig } from "../config";
import { AuthService, UsersService } from "../services";
import { PasswordResetRequestsDao } from "../daos";

export class PasswordResetService {
  constructor(
    private readonly logger: Logger,
    private readonly config: ApiConfig,
    private readonly topicMessageSender: TopicMessageSender,
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
    private readonly passwordResetRequestsDao: PasswordResetRequestsDao
  ) {}

  async createRequest(
    createPasswordResetRequest: CreatePasswordResetRequest
  ): Promise<DurationDisplayInfo> {
    const now = utcNow();
    const { email } = createPasswordResetRequest;

    const user = await this.usersService.readUserForEmail(email);
    if (!user) {
      if (this.config.doConcealEmailExistence) {
        this.logger.info(
          `silently ignoring password reset request the email of which did not correspond to a user: ${email}`
        );
        return {
          value: this.config.passwordResetDuration,
          formatTemplate: this.config.durationFormatTemplate,
          formatTrim: this.config.durationFormatTrim,
        };
      }
      throw new EntityNotFoundError(EntityTypes.USER, { email });
    }

    // TODO(561) delete previous unconsumed password resets?

    const passwordResetCode = randomBase64String(32);
    const duration = moment.duration(this.config.passwordResetDuration);
    const expires = momentAdd(now, duration);
    const isConsumed = false;
    await this.passwordResetRequestsDao.create(
      createPasswordResetRequest,
      user.id,
      passwordResetCode,
      expires,
      isConsumed,
      now
    );

    await this.sendConfirmationEmail(email, passwordResetCode, duration);

    return {
      value: this.config.passwordResetDuration,
      formatTemplate: this.config.durationFormatTemplate,
      formatTrim: this.config.durationFormatTrim,
    };
  }

  async checkRequestForCode(passwordResetCode: string) {
    const now = utcNow();
    const passwordResetRequest =
      await this.passwordResetRequestsDao.readForCode(passwordResetCode);
    if (!passwordResetRequest) {
      throw new EntityNotFoundError(
        "PASSWORD_RESET_REQUEST",
        passwordResetCode
      );
    }
    this.checkRequestValidity(passwordResetRequest, now);
    return passwordResetRequest.email;
  }

  async resetPasswordAndLogin(
    passwordResetConfirmation: PasswordResetConfirmation
  ) {
    const { newPassword, passwordResetCode } = passwordResetConfirmation;
    const passwordResetRequest =
      await this.passwordResetRequestsDao.readForCode(passwordResetCode);
    if (!passwordResetRequest) {
      throw new EntityNotFoundError(
        "PASSWORD_RESET_REQUEST",
        passwordResetCode
      );
    }
    const now = utcNow();
    this.checkRequestValidity(passwordResetRequest, now);
    await this.consumeRequest(passwordResetCode);
    const user = await this.usersService.updatePasswordForEmail(
      passwordResetRequest.email,
      newPassword
    );
    const {
      authToken,
      authTokenExpiration,
      authRefreshToken,
      authRefreshTokenExpiration,
    } = await this.authService.createAuthToken(user, now);
    return {
      user,
      authToken,
      authTokenExpiration,
      authRefreshToken,
      authRefreshTokenExpiration,
    };
  }

  private checkRequestValidity(
    passwordResetRequest: PasswordResetRequest,
    now: Moment
  ) {
    if (!passwordResetRequest) {
      throw new EntityNotFoundError(EntityTypes.PASSWORD_RESET_REQUEST);
    }
    if (passwordResetRequest.isConsumed) {
      throw new PasswordResetAlreadyConsumedError();
    }
    if (now.isAfter(passwordResetRequest.expires)) {
      throw new PasswordResetExpiredError();
    }
  }

  private async consumeRequest(passwordResetCode: string) {
    const rowCount = await this.passwordResetRequestsDao.consumeForCode(
      passwordResetCode
    );
    if (rowCount < 1) {
      throw newImpossibleError(
        `unable to consume password reset request for code despite previously reading unconsumed request for it: ${passwordResetCode}`
      );
    } else if (rowCount > 1) {
      this.logger.error(
        `consumed multiple PasswordResetRequests for the code: ${passwordResetCode}`
      );
    }
  }

  private async sendConfirmationEmail(
    email: string,
    passwordResetCode: string,
    duration: Duration
  ) {
    const confirmationUrl = `${
      this.config.uiAuthority
    }${commonPaths.confirmPasswordReset()}?passwordResetCode=${passwordResetCode}`;
    const durationText = duration.format(this.config.durationFormatTemplate, {
      trim: this.config.durationFormatTrim,
    });
    const params = {
      to: email,
      subject: "Howdju Password Reset",
      tags: { purpose: "reset-password" },
      bodyHtml: outdent`
      Hello,<br/>
      <br/>
      Howdju received a password reset request for this email address.<br/>
      <br/>
      <a href="${confirmationUrl}">Click here to reset your password.</a><br/>
      <br/>
      ${confirmationUrl}<br/>
      <br/>
      If you did not request a password request, you may disregard this message and the password request will
      expire after ${durationText}.
    `,
      bodyText: outdent`
      Hello,

      Howdju received a password reset request for this email address.  Click here to reset your password:

      ${confirmationUrl}

      If you did not request a password request, you may disregard this message and the password request will
      expire after ${durationText}.
    `,
    };
    await this.topicMessageSender.sendMessage({ type: "SEND_EMAIL", params });
  }
}
