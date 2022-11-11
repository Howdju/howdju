const Promise = require('bluebird')

const {
  EntityTypes,
  entityConflictCodes,
} = require('howdju-common')

const {EntityService} = require('./EntityService')
const {
  permissions
} = require('../permissions')
const {
  AuthorizationError,
  EntityNotFoundError,
  EntityConflictError,
} = require("../serviceErrors")
const {
  persorgSchema
} = require('./validationSchemas')

exports.PersorgsService = class PersorgsService extends EntityService {
  constructor(logger, authService, permissionsService, persorgsDao) {
    super(persorgSchema, logger, authService)
    this.logger = logger
    this.permissionsService = permissionsService
    this.persorgsDao = persorgsDao
  }

  async readPersorgForId(persorgId) {
    return await this.persorgsDao.readPersorgForId(persorgId)
  }

  async readOrCreateValidPersorgAsUser(persorg, userId, now) {
    if (persorg.id) {
      return {
        isExtant: true,
        persorg: await this.readPersorgForId(persorg.id),
      }
    }

    let dbPersorg = await this.persorgsDao.readEquivalentPersorg(persorg)
    if (dbPersorg) {
      return {
        isExtant: true,
        persorg: dbPersorg,
      }
    }

    dbPersorg = await this.persorgsDao.createPersorg(persorg, userId, now)

    return {
      isExtant: false,
      persorg: dbPersorg,
    }
  }

  async doUpdate(persorg, userId, now) {
    const permission = permissions.EDIT_ANY_ENTITY
    const [doesConflict, hasPermission] = await Promise.all([
      this.persorgsDao.hasEquivalentPersorgs(persorg),
      this.permissionsService.userHasPermission(userId, permission),
    ])

    if (doesConflict) {
      throw new EntityConflictError(
        {
          hasErrors: true,
          modelErrors: [entityConflictCodes.ALREADY_EXISTS],
        }
      )
    }
    if (!hasPermission) {
      throw new AuthorizationError(permission)
    }

    const updatedPersorg = await this.persorgsDao.updatePersorg(persorg, now)
    if (!updatedPersorg) {
      throw new EntityNotFoundError(EntityTypes.PERSORG, persorg.id)
    }
    return updatedPersorg
  }
}
