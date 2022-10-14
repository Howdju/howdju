const {
  JustificationRootTargetTypes,
  newExhaustedEnumError,
  requireArgs,
  EntityTypes,
} = require('howdju-common')

const {
  EntityNotFoundError
} = require('../serviceErrors')

const entityTypeByRootTargetType = {
  [JustificationRootTargetTypes.PROPOSITION]: EntityTypes.PROPOSITION,
  [JustificationRootTargetTypes.STATEMENT]: EntityTypes.STATEMENT,
  [JustificationRootTargetTypes.JUSTIFICATION]: EntityTypes.JUSTIFICATION,
}

exports.RootTargetJustificationsService = class RootTargetJustificationsService {

  constructor(authService, propositionsService, statementsService, justificationsService) {
    requireArgs({authService, propositionsService, justificationsService})
    this.authService = authService
    this.propositionsService = propositionsService
    this.statementsService = statementsService
    this.justificationsService = justificationsService
  }

  async readRootTarget(rootTargetType, rootTargetId, userId) {
    switch (rootTargetType) {
      case JustificationRootTargetTypes.PROPOSITION:
        return await this.propositionsService.readPropositionForId(rootTargetId, {userId})
      case JustificationRootTargetTypes.STATEMENT:
        return await this.statementsService.readStatementForId(rootTargetId)
      default:
        throw newExhaustedEnumError(rootTargetType)
    }
  }

  async readRootTargetWithJustifications(rootTargetType, rootTargetId, authToken) {
    const userId = await this.authService.readOptionalUserIdForAuthToken(authToken)
    const rootTarget = await this.readRootTarget(rootTargetType, rootTargetId, userId)
    if (!rootTarget) {
      const entityType = entityTypeByRootTargetType[rootTargetType]
      throw new EntityNotFoundError(entityType, rootTargetId)
    }
    const justifications = await this.justificationsService.readJustificationsWithBasesAndVotesByRootTarget(
      rootTargetType, rootTargetId, {userId})
    rootTarget.justifications = justifications
    return rootTarget
  }
}
