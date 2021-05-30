const bcrypt = require('bcryptjs')
const cryptohat = require('cryptohat')
const keys = require('lodash/keys')
const moment = require('moment')
const outdent = require('outdent')

const {
  commonPaths,
  entityErrorCodes,
  EntityType,
  makeUser,
  momentAdd,
  newImpossibleError,
  schemaIds,
  utcNow,
  validate,
} = require('howdju-common')

const {
  HashTypes
} = require('../hashTypes')
const {
  EntityValidationError,
  EntityConflictError,
  EntityNotFoundError,
  RegistrationAlreadyConsumedError,
  RegistrationExpiredError,
} = require('../serviceErrors')
const {topicMessages} = require('./topicMessages')

exports.RegistrationService = class RegistrationService {

  constructor(logger, config, topicMessageSender, usersService, authService, registrationRequestsDao) {
    this.logger = logger
    this.config = config
    this.topicMessageSender = topicMessageSender
    this.usersService = usersService
    this.authService = authService
    this.registrationRequestsDao = registrationRequestsDao
  }

  async createRequest(registrationRequest) {
    const {isValid, errors} = validate(schemaIds.registrationRequest, registrationRequest)
    if (!isValid) {
      throw new EntityValidationError(errors)
    }
    // TODO this is a race condition right now with creating the registration based upon the username/email
    const shouldContinue = await processRegistrationConflicts(this, registrationRequest)
    if (!shouldContinue) {
      return
    }

    const {registrationCode, duration} = await createRegistration(this, registrationRequest)
    await sendConfirmationEmail(this, registrationRequest, registrationCode, duration)

    return {
      value: this.config.registrationDuration,
      formatTemplate: this.config.durationFormatTemplate,
      formatTrim: this.config.durationFormatTrim,
    }
  }

  async checkRequestForCode(registrationCode) {
    const now = utcNow()
    const registration = await this.registrationRequestsDao.readForCode(registrationCode)
    await checkRegistrationRequestValidity(registration, now)
    return registration.email
  }

  async confirmRegistrationAndLogin(registrationConfirmation) {
    const now = utcNow()
    const registrationCode = registrationConfirmation.registrationCode
    const registrationRequest = await this.registrationRequestsDao.readForCode(registrationCode)
    await checkRegistrationRequestValidity(registrationRequest, now)
    // TODO this is a race condition right now with creating the registration based upon the username/email
    await checkRegistrationConfirmationConflicts(this, registrationConfirmation)
    await consumeRegistration(this, registrationCode)
    const user = await registerUser(this, registrationRequest, registrationConfirmation, now)
    const {authToken, expires} = await this.authService.createAuthToken(user, now)
    return {user, authToken, expires}
  }
}

/** Returns whether the registration should continue */
async function processRegistrationConflicts(self, registrationRequest) {
  const {email} = registrationRequest
  const entityConflicts = {}
  if (await self.usersService.isEmailInUse(email)) {
    if (self.config.doConcealEmailExistence) {
      await sendExistingAccountNotificationEmail(self, registrationRequest)
      return false
    }
    entityConflicts.email = {
      code: entityErrorCodes.EMAIL_TAKEN,
      value: email,
    }
  }
  if (await self.registrationRequestsDao.isEmailInUse(email)) {
    entityConflicts.email = {
      code: entityErrorCodes.EMAIL_TAKEN,
      value: email
    }
  }
  if (keys(entityConflicts).length > 0) {
    throw new EntityConflictError(entityConflicts)
  }

  return true
}

async function createRegistration(self, registrationRequest) {
  const registrationCode = cryptohat(256, 36)
  const now = utcNow()
  const duration = moment.duration(self.config.registrationDuration)
  const expires = momentAdd(now, duration)
  const isConsumed = false
  await self.registrationRequestsDao.create(registrationRequest, registrationCode, expires, isConsumed, now)
  return {registrationCode, duration}
}

async function sendConfirmationEmail(self, registrationRequest, registrationCode, duration) {
  const {email} = registrationRequest
  const confirmationUrl =
    `${this.config.uiAuthority}${commonPaths.confirmRegistration()}?registrationCode=${registrationCode}`
  const durationText = duration.format(self.config.durationFormatTemplate, {trim: self.config.durationFormatTrim})
  const emailParams = {
    to: email,
    subject: 'Howdju Registration',
    tags: {purpose: 'confirm-registration'},
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
  }
  await self.topicMessageSender.sendMessage(topicMessages.email(emailParams))
}

async function sendExistingAccountNotificationEmail(self, registrationRequest) {
  const {email} = registrationRequest
  const loginUrl = `${this.config.uiAuthority}${commonPaths.login()}`
  const resetUrl = `${this.config.uiAuthority}${commonPaths.requestPasswordReset()}`
  const emailParams = {
    to: email,
    subject: 'Howdju Registration',
    tags: {purpose: 're-registration-error'},
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
  }
  await self.topicMessageSender.sendMessage(topicMessages.email(emailParams))
}

async function checkRegistrationRequestValidity(registrationRequest, now) {
  if (!registrationRequest) {
    throw new EntityNotFoundError(EntityType.REGISTRATION_REQUEST)
  }
  if (registrationRequest.isConsumed) {
    throw new RegistrationAlreadyConsumedError()
  }
  if (now.isAfter(registrationRequest.expires)) {
    // We could delete registration here, but then the next time the user tries the link they would get a "missing" error
    //  which would be confusing.  So instead cleanup old registrations on a schedule?
    throw new RegistrationExpiredError()
  }
}

async function checkRegistrationConfirmationConflicts(self, registrationConfirmation) {
  const {username} = registrationConfirmation
  const entityConflicts = {}
  if (await self.usersService.isUsernameInUse(username)) {
    entityConflicts.username = {
      code: entityErrorCodes.USERNAME_TAKEN,
      value: username,
    }
  }
  if (keys(entityConflicts).length > 0) {
    throw new EntityConflictError(entityConflicts)
  }
}

async function consumeRegistration(self, registrationCode) {
  const rowCount = await self.registrationRequestsDao.consumeForCode(registrationCode)
  if (rowCount < 1) {
    throw newImpossibleError(`unable to consume registration for completion code despite previously reading unconsumed registration for it: ${registrationCode}`)
  } else if (rowCount > 1) {
    self.logger.error(`we consumed multiple registrations for the completion code: ${registrationCode}`)
  }
}

async function registerUser(self, registration, registrationConfirmation, now) {
  const passwordHash = await bcrypt.hash(registrationConfirmation.password, self.config.auth.bcrypt.saltRounds)
  const user = makeUser({
    username: registrationConfirmation.username,
    email: registration.email,
    shortName: registrationConfirmation.shortName,
    longName: registrationConfirmation.longName,
    acceptedTerms: now,
    isActive: true,
  })
  return await self.usersService.createRegisteredUser(user, passwordHash, HashTypes.BCRYPT, now)
}
