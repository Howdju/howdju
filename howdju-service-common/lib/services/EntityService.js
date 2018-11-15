const get = require('lodash/get')
const set = require('lodash/set')

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

function translateJoiError(joiError) {
  const allErrors = {}
  for (const {path, type, message} of joiError.details) {
    let errors = get(allErrors, path)
    if (!errors) {
      errors = []
      set(allErrors, path, errors)
    }
    errors.push({type, message})
  }
  return allErrors
}
