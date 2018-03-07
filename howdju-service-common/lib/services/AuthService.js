const bcrypt = require('bcrypt')
const cryptohat = require('cryptohat')
const moment = require('moment')
const Promise = require('bluebird')

const {
  EntityType,
  utcNow,
} = require('howdju-common')

const {
  EntityNotFoundError,
  UserIsInactiveError,
  EntityValidationError,
  InvalidLoginError,
  AuthenticationError,
} = require("../serviceErrors")
const {
  HashTypes
} = require('../hashTypes')


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

  readOptionalUserIdForAuthToken(authToken) {
    return this.authDao.getUserIdForAuthToken(authToken)
  }

  readUserIdForAuthToken(authToken) {
    return this.readOptionalUserIdForAuthToken(authToken).then(userId => {
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
      .then(() => ({authToken, expires}))
  }

  createOrUpdatePasswordAuthForUserId(userId, password) {
    return Promise.all([
      bcrypt.hash(password, this.config.auth.bcrypt.saltRounds),
      this.authDao.readUserHashForId(userId, HashTypes.BCRYPT),
    ])
      .then(([hash, extantUserHash]) => {
        if (extantUserHash) {
          return this.authDao.updateUserAuthForUserId(userId, hash, HashTypes.BCRYPT)
        }
        return this.authDao.createUserAuthForUserId(userId, hash, HashTypes.BCRYPT)
      })
  }

  verifyPassword(credentials) {
    return this.authDao.readUserHashForEmail(credentials.email, HashTypes.BCRYPT)
      .then( (userHash) => {
        if (!userHash) {
          throw new EntityNotFoundError(EntityType.PASSWORD_HASH)
        }
        this.logger.silly('userHash', userHash)
        const {userId, hash} = userHash
        let verifyPromise = null
        try {
          verifyPromise = bcrypt.compare(credentials.password, hash)
          this.logger.silly('proceeding past verify call')
        } catch (err) {
          this.logger.error('failed verification', err)
          verifyPromise = false
        }
        return Promise.all([
          verifyPromise,
          userId,
        ])
      })
      .then( ([isVerified, userId]) => {
        this.logger.silly('isVerified: ', isVerified)
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
      .then( ([user, {authToken, expires}]) => ({
        user,
        authToken,
        expires,
      }))
  }

  logout(authToken) {
    return this.authDao.deleteAuthToken(authToken)
  }
}
