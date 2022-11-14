const {
  requireArgs,
} = require('howdju-common')

const {
  EntityValidationError,
} = require('../serviceErrors')
const {
  translateJoiError,
} = require('./validationSchemas')

module.exports.EntityService = class EntityService {
  constructor(entitySchema, logger, authService) {
    requireArgs({entitySchema, logger, authService})
    this.entitySchema = entitySchema
    this.logger = logger
    this.authService = authService
  }

  async readOrCreate(entity, authToken) {
    const now = new Date()
    const userId = await this.authService.readUserIdForAuthToken(authToken)
    const {error, value} = this.entitySchema.validate(entity, {
      // report all errors
      abortEarly: false,
      // for now allow clients to send extra properties, such as viewmodel properties, for convenience.
      // in the future we might consolidate the validation for use between the client and API and have the client
      //   strip the unknown properties itself
      stripUnknown: true,
    })
    if (error) {
      const errors = translateJoiError(error)
      throw new EntityValidationError(errors)
    }
    return await this.doReadOrCreate(value, userId, now)
  }

  async update(entity, authToken) {
    if (!entity.id) {
      throw new EntityValidationError({id: ['id is required to update an entity']})
    }

    const now = new Date()
    const userId = await this.authService.readUserIdForAuthToken(authToken)
    const {error, value} = this.entitySchema.validate(entity, {
      // report all errors
      abortEarly: false,
      // for now allow clients to send extra properties, such as viewmodel properties, for convenience.
      // in the future we might consolidate the validation for use between the client and API and have the client
      //   strip the unknown properties itself
      stripUnknown: true,
    })
    if (error) {
      const errors = translateJoiError(error)
      throw new EntityValidationError(errors)
    }
    return await this.doUpdate(value, userId, now)
  }
}
