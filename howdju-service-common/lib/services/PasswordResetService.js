const cryptohat = require("cryptohat");
const moment = require("moment");
const outdent = require("outdent");

const {
  commonPaths,
  EntityTypes,
  momentAdd,
  newImpossibleError,
  utcNow,
  topicMessages,
} = require("howdju-common");
const {
  EntityNotFoundError,
  PasswordResetAlreadyConsumedError,
  PasswordResetExpiredError,
} = require("../serviceErrors");

exports.PasswordResetService = class PasswordResetsService {
  constructor(
    logger,
    config,
    topicMessageSender,
    usersService,
    authService,
    passwordResetRequestsDao
  ) {
    this.logger = logger;
    this.config = config;
    this.topicMessageSender = topicMessageSender;
    this.usersService = usersService;
    this.authService = authService;
    this.passwordResetRequestsDao = passwordResetRequestsDao;
  }

  async createRequest(passwordResetRequest) {
    const now = utcNow();
    const { email } = passwordResetRequest;

    const user = await this.usersService.readUserForEmail(email);
    if (!user) {
      if (this.config.doConcealEmailExistence) {
        this.logger.info(
          `silently ignoring password reset request the email of which did not correspond to a user: ${email}`
        );
        return;
      }
      throw new EntityNotFoundError(EntityTypes.USER, { email });
    }

    // TODO delete previous unconsumed password resets?

    const passwordResetCode = cryptohat(256, 36);
    const duration = moment.duration(this.config.passwordResetDuration);
    const expires = momentAdd(now, duration);
    const isConsumed = false;
    await this.passwordResetRequestsDao.create(
      passwordResetRequest,
      user.id,
      passwordResetCode,
      expires,
      isConsumed,
      now
    );

    await sendConfirmationEmail(this, email, passwordResetCode, duration);

    return {
      value: this.config.passwordResetDuration,
      formatTemplate: this.config.durationFormatTemplate,
      formatTrim: this.config.durationFormatTrim,
    };
  }

  async checkRequestForCode(passwordResetCode) {
    const now = utcNow();
    const passwordResetRequest =
      await this.passwordResetRequestsDao.readForCode(passwordResetCode);
    await checkRequestValidity(passwordResetRequest, now);
    return passwordResetRequest.email;
  }

  async resetPasswordAndLogin(passwordResetCode, passwordResetConfirmation) {
    const now = utcNow();
    const passwordResetRequest =
      await this.passwordResetRequestsDao.readForCode(passwordResetCode);
    await checkRequestValidity(passwordResetRequest, now);
    await consumeRequest(this, passwordResetCode);
    const user = await this.usersService.updatePasswordForEmail(
      passwordResetRequest.email,
      passwordResetConfirmation.newPassword
    );
    const { authToken, expires } = await this.authService.createAuthToken(
      user,
      now
    );
    return { user, authToken, expires };
  }
};

async function checkRequestValidity(passwordResetRequest, now) {
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

async function consumeRequest(self, passwordResetCode) {
  const rowCount = await self.passwordResetRequestsDao.consumeForCode(
    passwordResetCode
  );
  if (rowCount < 1) {
    throw newImpossibleError(
      `unable to consume password reset request for code despite previously reading unconsumed request for it: ${passwordResetCode}`
    );
  } else if (rowCount > 1) {
    self.logger.error(
      `consumed multiple PasswordResetRequests for the code: ${passwordResetCode}`
    );
  }
}

async function sendConfirmationEmail(self, email, passwordResetCode, duration) {
  const confirmationUrl = `${
    this.config.uiAuthority
  }${commonPaths.confirmPasswordReset()}?passwordResetCode=${passwordResetCode}`;
  const durationText = duration.format(self.config.durationFormatTemplate, {
    trim: self.config.durationFormatTrim,
  });
  const emailParams = {
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
  await self.topicMessageSender.sendMessage(topicMessages.email(emailParams));
}
