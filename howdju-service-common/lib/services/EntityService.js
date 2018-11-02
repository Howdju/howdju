const {
  requireArgs
} = require('howdju-common')

const {
  EntityValidationError
} = require('../serviceErrors')

module.exports.EntityService = class EntityService {
  constructor(logger, authService) {
    requireArgs({logger, authService})
    this.logger = logger
    this.authService = authService
  }

  async readOrCreate(authToken, entity) {
    const now = new Date()
    const userId = await this.authService.readUserIdForAuthToken(authToken)
    const {error: validationError, value: validatedEntity} = this.entitySchema.validate(entity, {
      abortEarly: false
    })
    if (validationError) {
      throw new EntityValidationError(validationError)
    }
    return await this.doReadOrCreate(validatedEntity, userId, now)
  }
}
