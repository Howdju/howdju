const Promise = require('bluebird')

const {
  ActionType,
  ActionTargetType,
  EntityType,
  makeAccountSettings,
  requireArgs,
  schemaIds,
  utcNow,
  validate,
} = require('howdju-common')


const {
  permissions
} = require('../permissions')
const {
  EntityValidationError,
  EntityNotFoundError,
} = require('../serviceErrors')

exports.UsersService = class UsersService {

  constructor(userValidator, actionsService, authService, permissionsService, userExternalIdsDao, usersDao, accountSettingsDao) {
    requireArgs({userValidator, actionsService, authService, permissionsService, userExternalIdsDao, usersDao, accountSettingsDao})
    this.userValidator = userValidator
    this.actionsService = actionsService
    this.authService = authService
    this.permissionsService = permissionsService
    this.userExternalIdsDao = userExternalIdsDao
    this.usersDao = usersDao
    this.accountSettingsDao = accountSettingsDao
  }

  async isEmailInUse(email) {
    return await this.usersDao.isEmailInUse(email)
  }

  async isUsernameInUse(username) {
    return await this.usersDao.isUsernameInUse(username)
  }

  createUserAsAuthToken(authToken, user) {
    return this.permissionsService.readUserIdHavingPermissionForAuthToken(authToken, permissions.CREATE_USERS)
      .then(creatorUserId => this.createUserAsUser(creatorUserId, user))
  }

  async readUserForId(userId) {
    return await this.usersDao.readUserForId(userId)
  }

  async readUserForEmail(email) {
    return await this.usersDao.readUserForEmail(email)
  }

  updatePasswordForEmail(email, password) {
    return this.usersDao.readUserForEmail(email)
      .then((user) => {
        if (!user) {
          throw new EntityNotFoundError(EntityType.USER, email)
        }

        return Promise.all([
          user,
          this.authService.createOrUpdatePasswordAuthForUserId(user.id, password),
        ])
      })
      .then(([user]) => user)
  }

  async createRegisteredUser(user, passwordHash, passwordHashType, now) {
    const {isValid, errors} = validate(schemaIds.user, user)
    if (!isValid) {
      throw new EntityValidationError(errors)
    }

    const createdUser = await this.usersDao.createUser(user, null, now)
    await this.authService.createPasswordHashAuthForUserId(createdUser.id, passwordHash, passwordHashType)
    await this.userExternalIdsDao.createExternalIdsForUserId(createdUser.id)
    this.actionsService.asyncRecordAction(createdUser.id, createdUser.created, ActionType.CREATE, ActionTargetType.USER, createdUser.id)
    return this.usersDao.readUserForId(createdUser.id)
  }

  createUserAsUser(creatorUserId, user, password) {
    return Promise.resolve()
      .then(() => {
        requireArgs({creatorUserId, user, password})

        const validationErrors = this.userValidator.validate(user)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(({user: validationErrors}))
        }
        return validationErrors
      })
      .then(() => {
        const now = utcNow()
        return [
          this.usersDao.createUser(user, creatorUserId, now),
          now,
        ]
      })
      .then(([dbUser, now]) => Promise.all([
        dbUser,
        this.authService.createOrUpdatePasswordAuthForUserId(dbUser.id, password),
        this.userExternalIdsDao.createExternalIdsForUserId(dbUser.id),
        this.accountSettingsDao.createAccountSettingsForUserId(dbUser.id, makeAccountSettings(), now),
      ]))
      .then(([dbUser]) => {
        this.actionsService.asyncRecordAction(creatorUserId, dbUser.created, ActionType.CREATE, ActionTargetType.USER, dbUser.id)
        return dbUser
      })
  }
}
