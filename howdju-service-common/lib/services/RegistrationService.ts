import bcrypt from "bcryptjs";
import moment, { Duration, Moment } from "moment";
import outdent from "outdent";

import {
  commonPaths,
  CreateRegistrationRequest,
  EntityTypes,
  ModelErrors,
  momentAdd,
  newImpossibleError,
  randomBase36Number,
  RegistrationConfirmation,
  RegistrationRequest,
  utcNow,
  makeModelErrors,
  Logger,
  TopicMessageSender,
  topicMessages,
} from "howdju-common";

import { HashTypes } from "../hashTypes";
import {
  EntityNotFoundError,
  EntityValidationError,
  RegistrationAlreadyConsumedError,
  RegistrationExpiredError,
} from "../serviceErrors";
import { UsersService } from "./UsersService";
import { AuthService } from "./AuthService";
import { ApiConfig, RegistrationRequestsDao } from "..";
import {
  CreateRegistrationRequestData,
  CreateUserDataIn,
} from "@/daos/dataTypes";

export class RegistrationService {
  logger: Logger;
  config: ApiConfig;
  topicMessageSender: TopicMessageSender;
  usersService: UsersService;
  authService: AuthService;
  registrationRequestsDao: RegistrationRequestsDao;

  constructor(
    logger: Logger,
    config: ApiConfig,
    topicMessageSender: TopicMessageSender,
    usersService: UsersService,
    authService: AuthService,
    registrationRequestsDao: RegistrationRequestsDao
  ) {
    this.logger = logger;
    this.config = config;
    this.topicMessageSender = topicMessageSender;
    this.usersService = usersService;
    this.authService = authService;
    this.registrationRequestsDao = registrationRequestsDao;
  }

  /** Creates a registration request. */
  async createRequest(registrationRequest: CreateRegistrationRequest) {
    // TODO: we should be able to assume that the input was already validated by the request model validation.
    const result = CreateRegistrationRequest.safeParse(registrationRequest);
    if (!result.success) {
      throw new EntityValidationError(result.error);
    }
    const { error, hideEmail } = await this.validateRegistrationConflicts(
      registrationRequest
    );
    if (error) {
      throw new EntityValidationError(error);
    }
    if (hideEmail) {
      return {
        value: this.config.registrationDuration,
        formatTemplate: this.config.durationFormatTemplate,
        formatTrim: this.config.durationFormatTrim,
      };
    }

    const { registrationCode, duration } = await this.createRegistration(
      registrationRequest
    );
    await this.sendConfirmationEmail(
      registrationRequest,
      registrationCode,
      duration
    );

    return {
      value: this.config.registrationDuration,
      formatTemplate: this.config.durationFormatTemplate,
      formatTrim: this.config.durationFormatTrim,
    };
  }

  /** Reads a registration request by code */
  async checkRequestForCode(registrationCode: string) {
    const now = utcNow();
    const registration = await this.registrationRequestsDao.readForCode(
      registrationCode
    );
    this.checkRegistrationRequestValidity(registration, now);
    return registration.email;
  }

  /** Updates a registration request to be confirmed and returns an auth token. */
  async confirmRegistrationAndLogin(
    registrationConfirmation: RegistrationConfirmation
  ) {
    const now = utcNow();
    const registrationCode = registrationConfirmation.registrationCode;
    const registrationRequest = await this.registrationRequestsDao.readForCode(
      registrationCode
    );
    this.checkRegistrationRequestValidity(registrationRequest, now);
    // TODO this is a race condition right now with creating the registration based upon the username/email
    const error = await this.checkRegistrationConfirmationConflicts(
      registrationConfirmation
    );
    if (error) {
      throw new EntityValidationError(error);
    }
    await this.consumeRegistration(registrationCode);
    const user = await this.registerUser(
      registrationRequest,
      registrationConfirmation,
      now
    );
    const { authToken, expires } = await this.authService.createAuthToken(
      user,
      now
    );
    return { user, authToken, expires };
  }

  /** Returns whether the registration should continue */
  private async validateRegistrationConflicts(
    registrationRequest: CreateRegistrationRequest
  ): Promise<{
    error?: ModelErrors<CreateRegistrationRequest>;
    hideEmail?: boolean;
  }> {
    const { email } = registrationRequest;
    const isEmailInUse = await this.usersService.isEmailInUse(email);
    if (isEmailInUse) {
      if (this.config.doConcealEmailExistence) {
        await this.sendExistingAccountNotificationEmail(registrationRequest);
        return { hideEmail: true };
      }
      return {
        error: makeModelErrors<CreateRegistrationRequest>((r) =>
          r.email({
            message: `Email is already in use: ${email}`,
            params: { code: "ALREADY_EXISTS", email },
          })
        ),
      };
    }

    return {};
  }

  private checkRegistrationRequestValidity(
    registrationRequest: RegistrationRequest,
    now: Moment
  ) {
    if (!registrationRequest) {
      throw new EntityNotFoundError(EntityTypes.REGISTRATION_REQUEST);
    }
    if (registrationRequest.isConsumed) {
      throw new RegistrationAlreadyConsumedError();
    }
    if (now.isSameOrAfter(registrationRequest.expires)) {
      // We could delete registration here, but then the next time the user tries the link they would get a "missing" error
      //  which would be confusing.  So instead cleanup old registrations on a schedule?
      this.logger.debug(
        `now (${now.format()}) ≥ registrationRequest.expires (${
          registrationRequest.expires
        }))`
      );
      throw new RegistrationExpiredError();
    }
  }

  private async createRegistration(
    createRegistrationRequest: CreateRegistrationRequest
  ) {
    const now = utcNow();
    const duration = moment.duration(this.config.registrationDuration);
    const expires = momentAdd(now, duration);
    const registrationRequest: CreateRegistrationRequestData = {
      ...createRegistrationRequest,
      expires,
    };
    // Although we persist the registration code as part of the registration request, we never want
    // to return it to a client or else they can complete their registration without having access
    // to the email they provided. So just keep them separate to avoid accidentally returning it.
    const registrationCode = randomBase36Number(32);
    await this.registrationRequestsDao.create(
      registrationRequest,
      registrationCode,
      now
    );
    return { registrationRequest, registrationCode, duration };
  }

  private async sendConfirmationEmail(
    registrationRequest: CreateRegistrationRequest,
    registrationCode: string,
    duration: Duration
  ) {
    const { email } = registrationRequest;
    const confirmationUrl = `${
      this.config.uiAuthority
    }${commonPaths.confirmRegistration()}?registrationCode=${registrationCode}`;
    const durationText = duration.format(this.config.durationFormatTemplate, {
      trim: this.config.durationFormatTrim,
    });
    const emailParams = {
      to: email,
      subject: "Howdju Registration",
      tags: { purpose: "confirm-registration" },
      bodyHtml: outdent`
        Hello,<br/>
        <br/>
        Please click <a href="${confirmationUrl}">this link</a> to complete your registration<br/>
        <br/>
        ${confirmationUrl}<br/>
        <br/>
        You must complete your registration within ${durationText}.  If your registration expires, please register again.<br/>
        <br/>
        If you did not register on howdju.com, you may ignore this email and the registration will expire.
      `,
      bodyText: outdent`
        Hello,

        Please click this link to complete your registration:

        ${confirmationUrl}

        You must complete your registration within 24 hours.  If your registration expires, please register again.

        If you did not register on howdju.com, you may ignore this email and the registration will expire.
      `,
    };
    await this.topicMessageSender.sendMessage(topicMessages.email(emailParams));
  }

  private async sendExistingAccountNotificationEmail(
    registrationRequest: CreateRegistrationRequest
  ) {
    const { email } = registrationRequest;
    const loginUrl = `${this.config.uiAuthority}${commonPaths.login()}`;
    const resetUrl = `${
      this.config.uiAuthority
    }${commonPaths.requestPasswordReset()}`;
    const emailParams = {
      to: email,
      subject: "Howdju Registration",
      tags: { purpose: "re-registration-error" },
      bodyHtml: outdent`
        Hello,
        <br/><br/>
        A request to register your email address was received, but your email address is already registered.  If you
        tried to register on howdju.com, you can instead <a href="${loginUrl}">login here<a>.
        <br/><br/>
        If you have forgotten your password, please <a href="${resetUrl}">reset your password here</a>.
        <br/><br/>
        If you did not register on howdju.com, you may ignore this email.
      `,
      bodyText: outdent`
        Hello,

        A request to register your email address was received, but your email address is already registered.  If you
        tried to register on howdju.com, you can instead <a href="${loginUrl}">login here<a>.

        If you have forgotten your password, please <a href="${resetUrl}">reset your password here</a>.

        If you did not register on howdju.com, you may ignore this email.
      `,
    };
    await this.topicMessageSender.sendMessage(topicMessages.email(emailParams));
  }

  private async checkRegistrationConfirmationConflicts(
    registrationConfirmation: RegistrationConfirmation
  ): Promise<ModelErrors<RegistrationConfirmation> | null> {
    const { username } = registrationConfirmation;
    if (await this.usersService.isUsernameInUse(username)) {
      return makeModelErrors<RegistrationConfirmation>((r) =>
        r.username({
          message: `The username is already in use: ${username}`,
          params: {
            code: "ALREADY_IN_USE",
            username,
          },
        })
      );
    }
    return null;
  }

  private async consumeRegistration(registrationCode: string) {
    const rowCount = await this.registrationRequestsDao.consumeForCode(
      registrationCode
    );
    if (rowCount < 1) {
      throw newImpossibleError(
        `unable to consume registration for completion code despite previously reading unconsumed registration for it: ${registrationCode}`
      );
    } else if (rowCount > 1) {
      this.logger.error(
        `we consumed multiple registrations for the completion code: ${registrationCode}`
      );
    }
  }

  private async registerUser(
    registration: RegistrationRequest,
    registrationConfirmation: RegistrationConfirmation,
    now: Moment
  ) {
    const passwordHash = await bcrypt.hash(
      registrationConfirmation.password,
      this.config.auth.bcrypt.saltRounds
    );
    const userData: CreateUserDataIn = {
      username: registrationConfirmation.username,
      email: registration.email,
      phoneNumber: registrationConfirmation.phoneNumber,
      shortName: registrationConfirmation.shortName,
      longName: registrationConfirmation.longName,
      acceptedTerms: now,
      affirmedMajorityConsent: now,
      affirmed13YearsOrOlder: now,
      affirmedNotGdpr: now,
      isActive: true,
    };
    return await this.usersService.createRegisteredUser(
      userData,
      passwordHash,
      HashTypes.BCRYPT,
      now
    );
  }
}
