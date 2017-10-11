const Promise = require('bluebird')

const {
  EntityType,
  requireArgs,
} = require('howdju-common')

const {
  EntityNotFoundError
} = require('../serviceErrors')

exports.StatementJustificationsService = class StatementJustificationsService {

  constructor(authService, statementsService, justificationsService) {
    requireArgs({authService, statementsService, justificationsService})
    this.authService = authService
    this.statementsService = statementsService
    this.justificationsService = justificationsService
  }

  readStatementJustifications(statementId, authToken) {
    return this.authService.readOptionalUserIdForAuthToken(authToken)
      .then( (userId) => Promise.all([
        this.statementsService.readStatementForId(statementId, {userId}),
        this.justificationsService.readJustificationsWithBasesAndVotesByRootStatementId(statementId, {userId}),
      ]))
      .then(([statement, justifications]) => {
        if (!statement) {
          throw new EntityNotFoundError(EntityType.STATEMENT, statementId)
        }

        return {
          statement,
          justifications,
        }
      })
  }
}
