const argon2 = require('argon2')
const cryptohat = require('cryptohat')
const moment = require('moment')
const Promise = require('bluebird')

const {
  EntityTypes,
  utcNow,
} = require('howdju-common')

const {
  EntityNotFoundError,
  UserIsInactiveError,
  EntityValidationError,
  InvalidLoginError,
  AuthenticationError,
} = require("../serviceErrors")


const ensureActive = (user) => {
  if (!user.isActive) {
    throw new UserIsInactiveError(user.userId)
  }
  return user
}

exports.AuthService = class AuthService {

  constructor(config, logger, credentialValidator, authDao, usersDao) {
    this.config = config
    this.logger = logger
    this.credentialValidator = credentialValidator
    this.authDao = authDao
    this.usersDao = usersDao
  }

  readUserIdForAuthToken(authToken) {
    return this.authDao.getUserIdForAuthToken(authToken).then(userId => {
      if (!userId) {
        throw new AuthenticationError()
      }
      return userId
    })
  }

  updateLastLogin(user, now) {
    return this.usersDao.updateLastLoginForUserId(user.id, now)
  }

  createAuthToken(user, now) {
    const authToken = cryptohat(256, 36)
    const expires = now.add(moment.duration.apply(moment.duration, this.config.authTokenDuration))

    return this.authDao.insertAuthToken(user.id, authToken, now, expires)
  }

  createAuthForUserIdWithPassword(userId, password) {
    return argon2.hash(password)
      .then(hash => this.authDao.createUserAuthForUserId(userId, hash))
  }

  updateAuthForUserIdWithPassword(userId, password) {
    return argon2.hash(password)
      .then(hash => this.authDao.updateUserAuthForUserId(userId, hash))
  }

  verifyPassword(credentials) {
    return this.authDao.readUserHashForEmail(credentials.email)
      .then( (userHash) => {
        if (!userHash) {
          throw new EntityNotFoundError(EntityTypes.USER, credentials.email)
        }
        this.logger.silly('userHash', userHash)
        let verifyPromise = null
        try {
          verifyPromise = argon2.verify(userHash.hash, credentials.password)
          this.logger.silly('proceeding past verify call')
        } catch (err) {
          this.logger.error('failed verification', err)
          verifyPromise = false
        }
        return Promise.all([
          verifyPromise,
          userHash.userId,
        ])
      })
      .then( ([isVerified, userId]) => {
        if (!isVerified) {
          throw new InvalidLoginError()
        }

        return userId
      })
  }

  validateCredentials(credentials) {
    const validationErrors = this.credentialValidator.validate(credentials)
    if (validationErrors.hasErrors) {
      throw new EntityValidationError({credentials: validationErrors})
    }
    return credentials
  }

  login(credentials) {
    return Promise.resolve()
      .then(() => this.validateCredentials(credentials))
      .then(() => this.verifyPassword(credentials))
      .then(userId => this.usersDao.readUserForId(userId))
      .then(user => ensureActive(user))
      .then(user => {
        const now = utcNow()
        return Promise.all([
          user,
          this.createAuthToken(user, now),
          this.updateLastLogin(user, now)
        ])
      })
      .then( ([user, authToken]) => ({
        user,
        authToken,
      }))
  }

  logout(authToken) {
    return this.authDao.deleteAuthToken(authToken)
  }
}
