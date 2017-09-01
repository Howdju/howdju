const Promise = require('bluebird')

const {
  EntityTypes
} = require('howdju-common')

const {
  EntityNotFoundError
} = require('../serviceErrors')

exports.StatementJustificationsService = class StatementJustificationsService {

  constructor(statementsDao, justificationsDao) {
    this.statementsDao = statementsDao
    this.justificationsDao = justificationsDao
  }

  readStatementJustifications(statementId, authToken) {
    return Promise.resolve([
      statementId,
      authToken,
    ])
      .then(([statementId, authToken]) => Promise.all([
        this.statementsDao.readStatementById(statementId),
        this.justificationsDao.readJustificationsWithBasesAndVotesByRootStatementId(authToken, statementId),
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
