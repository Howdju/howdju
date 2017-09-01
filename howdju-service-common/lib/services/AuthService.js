const argon2 = require('argon2')
const cryptohat = require('cryptohat')
const moment = require('moment')
const Promise = require('bluebird')

const {
  EntityTypes,
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

  createUserAuthForUserId(userId, hash) {
    return this.authDao.createUserAuthForUserId(userId, hash)
  }

  verifyPassword(credentials) {
    return Promise.all([
      credentials,
      this.authDao.readUserHashForEmail(credentials.email),
    ])
      .then(([credentials, userHash]) => {
        if (!userHash) {
          throw new EntityNotFoundError(EntityTypes.USER, credentials.email)
        }
        return Promise.all([
          argon2.verify(userHash.hash, credentials.password),
          userHash.userId,
        ])
      })
      .then( ([isMatch, userId]) => {
        if (!isMatch) {
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
    return Promise.resolve(credentials)
      .then(this.validateCredentials)
      .then(this.verifyPassword)
      .then(this.usersDao.readUserForId)
      .then(ensureActive)
      .then(user => {
        const now = moment()
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
