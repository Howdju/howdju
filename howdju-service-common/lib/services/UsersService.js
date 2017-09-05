const argon2 = require('argon2')
const Promise = require('bluebird')

const {
  ActionType,
  ActionTargetType,
} = require('howdju-common')

const {
  CREATE_USERS
} = require('../permissions')
const {
  EntityValidationError
} = require('../serviceErrors')

exports.UsersService = class UsersService {

  constructor(userValidator, actionsService, authService, permissionsService, userExternalIdsDao, usersDao) {
    this.userValidator = userValidator
    this.actionsService = actionsService
    this.authService = authService
    this.permissionsService = permissionsService
    this.userExternalIdsDao = userExternalIdsDao
    this.usersDao = usersDao
  }

  createUser(authToken, user) {
    return this.permissionsService.readUserIdHavingPermissionForAuthToken(authToken, CREATE_USERS)
      .then(creatorUserId => this.createUserAsUser(creatorUserId, user))
  }

  createUserAsUser(creatorUserId, user) {
    return Promise.resolve()
      .then(() => {
        const validationErrors = this.userValidator.validate(user)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(({user: validationErrors}))
        }
        return validationErrors
      })
      .then(() => Promise.all([
        argon2.generateSalt().then(salt => argon2.hash(user.password, salt)),
        new Date(),
      ]))
      .then(([hash, now]) => Promise.all([
        this.usersDao.createUser(user, creatorUserId, now),
        hash,
        now,
      ]))
      .then(([dbUser, hash, now]) => Promise.all([
        dbUser,
        now,
        this.authService.createUserAuthForUserId(dbUser.id, hash),
        this.userExternalIdsDao.createExternalIdsForUserId(dbUser.id)
      ]))
      .then(([dbUser, now]) => {
        this.actionsService.asyncRecordAction(creatorUserId, now, ActionType.CREATE, ActionTargetType.USER, dbUser.id)
        return dbUser
      })
  }
}
