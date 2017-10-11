const {
  requireArgs
} = require('howdju-common')

exports.StatementTagsService = class StatementTagsService {

  constructor(logger, statementTagsDao) {
    requireArgs({logger, statementTagsDao})
    this.logger = logger
    this.statementTagsDao = statementTagsDao
  }

  readTagsForStatementId(statementId) {
    return this.statementTagsDao.readTagsForStatementId(statementId)
  }

  readRecommendedTagsForStatementId(statementId) {
    return this.statementTagsDao.readRecommendedTagsForStatementId(statementId)
  }

  readStatementsRecommendedForTagId(tagId) {
    return this.statementTagsDao.readStatementsRecommendedForTagId(tagId)
  }

  readTaggedStatementsByVotePolarityAsUser(userId, tagId) {
    return this.statementTagsDao.readTaggedStatementsByVotePolarityAsUser(userId, tagId)
  }
}