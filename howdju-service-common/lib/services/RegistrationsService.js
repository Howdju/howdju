const bcrypt = require('bcrypt')
const cryptohat = require('cryptohat')
const keys = require('lodash/keys')
const outdent = require('outdent')

const {
  entityErrorCodes,
  EntityType,
  makeUser,
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

exports.RegistrationsService = class RegistrationsService {
  
  constructor(logger, config, emailService, usersService, authService, registrationsDao) {
    this.logger = logger
    this.config = config
    this.emailService = emailService
    this.usersService = usersService
    this.authService = authService
    this.registrationsDao = registrationsDao
  }
  
  async createRegistration(registration) {
    const {isValid, errors} = validate(schemaIds.registration, registration)
    if (!isValid) {
      throw new EntityValidationError(errors)
    }
    // TODO this is a race condition right now with creating the registration based upon the username/email
    await checkRegistrationConflicts(this, registration)
    const registrationConfirmationCode = await createRegistration(this, registration)
    await sendConfirmationEmail(this, registration, registrationConfirmationCode)
  }
  
  async readRegistration(registrationConfirmationCode) {
    const now = utcNow()
    const registration = await this.registrationsDao.readRegistrationForCompletionCode(registrationConfirmationCode)
    await checkRegistrationValidity(registration, now)
  }

  async confirmRegistration(registrationConfirmation) {
    const now = utcNow()
    const registrationConfirmationCode = registrationConfirmation.registrationConfirmationCode
    const registration = await this.registrationsDao.readRegistrationForCompletionCode(registrationConfirmationCode)
    await checkRegistrationValidity(registration, now)
    // TODO this is a race condition right now with creating the registration based upon the username/email
    await checkRegistrationConfirmationConflicts(this, registrationConfirmation)
    await consumeRegistration(this, registrationConfirmationCode)
    const user = await registerUser(this, registration, registrationConfirmation, now)
    const {authToken, expires} = await this.authService.createAuthToken(user, now)
    return {user, authToken, expires}
  }
}

async function checkRegistrationConflicts(self, registration) {
  const {email} = registration
  const entityConflicts = {}
  if (await self.usersService.isEmailInUse(email)) {
    entityConflicts.email = {
      code: entityErrorCodes.EMAIL_TAKEN,
      value: email,
    }
  }
  if (await self.registrationsDao.isEmailInUse(email)) {
    entityConflicts.email = {
      code: entityErrorCodes.EMAIL_TAKEN,
      value: email
    }
  }
  if (keys(entityConflicts).length > 0) {
    throw new EntityConflictError(entityConflicts)
  }
}

async function createRegistration(self, registration) {
  const registrationConfirmationCode = cryptohat(256, 36)
  const now = utcNow()
  const expires = now.clone()
  expires.add(self.config.registrationValidDuration)
  const isConsumed = false
  await self.registrationsDao.createRegistration(registration, registrationConfirmationCode, expires, isConsumed, now)
  return registrationConfirmationCode
}

async function sendConfirmationEmail(self, email, registrationConfirmationCode) {
  const confirmationUrl =
    `https://www.howdju.com/confirm-registration?registrationConfirmationCode=${registrationConfirmationCode}`
  const emailParams = {
    to: email,
    subject: 'Howdju Registration',
    tags: [{purpose: 'confirm-registration'}],
    bodyHtml: outdent`
        Hello,<br/>
        <br/>
        Please click <a href="${confirmationUrl}">this link</a> to complete your registration<br/>
        <br/>
        ${confirmationUrl}<br/>
        <br/>
        You must complete your registration within 24 hours.  If your registration expires, please register again.<br/>
        <br/>
        If you did not register on howdju.com, please ignore this email or contact us.
      `,
    bodyText: outdent`
        Hello,
        
        Please click this link to complete your registration:
        
        ${confirmationUrl}
        
        You must complete your registration within 24 hours.  If your registration expires, please register again.
        
        If you did not register on howdju.com, please ignore this email or contact us.
      `,
  }
  await self.emailService.sendEmail(emailParams)
}

async function checkRegistrationValidity(registration, now) {
  if (!registration) {
    throw new EntityNotFoundError(EntityType.REGISTRATION)
  }
  if (registration.isConsumed) {
    throw new RegistrationAlreadyConsumedError()
  }
  if (now.isAfter(registration.expires)) {
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

async function consumeRegistration(self, registrationConfirmationCode) {
  const rowCount = await self.registrationsDao.consumeRegistrationForCompletionCode(registrationConfirmationCode)
  if (rowCount < 1) {
    throw newImpossibleError(`unable to consume registration for completion code despite previously reading unconsumed registration for it: ${registrationConfirmationCode}`)
  } else if (rowCount > 1) {
    self.logger.error(`we consumed multiple registrations for the completion code: ${registrationConfirmationCode}`)
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
