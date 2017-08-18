const argon2 = require('argon2')
const cryptohat = require('cryptohat')
const moment = require('moment')
const Promise = require('bluebird')


const config = require('../config')
const {logger} = require('../logger')
const usersDao = require('../dao/usersDao')
const authDao = require('../dao/authDao')
const {
  credentialValidator,
} = require('../validators')
const {
  EntityNotFoundError,
  UserIsInactiveError,
  EntityValidationError,
  InvalidLoginError,
} = require("../errors")
const {
  EntityTypes,
} = require('../models')

const validateCredentials = (credentials) => {
  const validationErrors = credentialValidator.validate(credentials)
  if (validationErrors.hasErrors) {
    throw new EntityValidationError({credentials: validationErrors})
  }
  return credentials
}

const verifyPassword = (credentials) =>
    Promise.all([
      credentials,
      authDao.readUserHashForEmail(credentials.email),
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

const ensureActive = (user) => {
  if (!user.isActive) {
    throw new UserIsInactiveError(user.userId)
  }
  return user
}

const createAuthToken = (user, now) => {
  const authToken = cryptohat(256, 36)
  const expires = now.add(moment.duration.apply(moment.duration, config.authTokenDuration))

  return authDao.insertAuthToken(user.id, authToken, now, expires)
}

const updateLastLogin = (user, now) => {
  usersDao.updateLastLoginForUserId(user.id, now)
}

module.exports.login = (credentials) => Promise.resolve(credentials)
    .then(validateCredentials)
    .then(verifyPassword)
    .then(usersDao.readUserForId)
    .then(ensureActive)
    .then(user => {
      const now = moment()
      return Promise.all([
        user,
        createAuthToken(user, now),
        updateLastLogin(user, now)
      ])
    })
    .then( ([user, authToken]) => ({
      user,
      authToken,
    }))

module.exports.logout = authToken => authDao.deleteAuthToken(authToken)