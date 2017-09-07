const Promise = require('bluebird')

const {
  ActionType,
  ActionTargetType,
  EntityTypes,
} = require('howdju-common')

const {
  CREATE_USERS
} = require('../permissions')
const {
  EntityValidationError,
  EntityNotFoundError,
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

  updatePasswordForEmail(email, password) {
    return this.usersDao.readUserForEmail(email)
      .then((user) => {
        if (!user) {
          throw new EntityNotFoundError(EntityTypes.USER, email)
        }

        return this.authService.updateAuthForUserIdWithPassword(user.id, password)
      })
  }

  createUserAsUser(creatorUserId, user, password) {
    return Promise.resolve()
      .then(() => {
        const validationErrors = this.userValidator.validate(user)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(({user: validationErrors}))
        }
        return validationErrors
      })
      .then(() => {
        const now = utcNow()
        this.usersDao.createUser(user, creatorUserId, now)
      })
      .then((dbUser) => Promise.all([
        dbUser,
        this.authService.createAuthForUserIdWithPassword(dbUser, password),
        this.userExternalIdsDao.createExternalIdsForUserId(dbUser.id)
      ]))
      .then(([dbUser]) => {
        this.actionsService.asyncRecordAction(creatorUserId, dbUser.created, ActionType.CREATE, ActionTargetType.USER, dbUser.id)
        return dbUser
      })
  }
}
