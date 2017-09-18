const Promise = require('bluebird')

const {
  EntityTypes,
  requireArgs,
} = require('howdju-common')

const {
  EntityNotFoundError
} = require('../serviceErrors')

exports.StatementJustificationsService = class StatementJustificationsService {

  constructor(authService, statementsDao, justificationsDao) {
    requireArgs({authService, statementsDao, justificationsDao})
    this.authService = authService
    this.statementsDao = statementsDao
    this.justificationsDao = justificationsDao
  }

  readStatementJustifications(statementId, authToken) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then( (userId) => Promise.all([
        this.statementsDao.readStatementForId(statementId),
        this.justificationsDao.readJustificationsWithBasesAndVotesByRootStatementId(statementId, {userId}),
      ]))
      .then(([statement, justifications]) => {
        if (!statement) {
          throw new EntityNotFoundError(EntityTypes.STATEMENT, statementId)
        }
        return {
          statement,
          justifications,
        }
      })
  }
}
