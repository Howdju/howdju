const {
  requireArgs
} = require('howdju-common')

const {
  mapSingle
} = require('./util')
const {
  toSourceExcerptParaphrase
} = require('./orm')


exports.SourceExcerptParaphrasesDao = class SourceExcerptParaphrasesDao {
  constructor(logger, database, statementsDao, writQuotesDao, picRegionsDao, vidSegmentsDao) {
    requireArgs({logger, database, statementsDao, writQuotesDao, picRegionsDao, vidSegmentsDao})

    this.logger = logger
    this.database = database
    this.statementsDao = statementsDao
    this.writQuotesDao = writQuotesDao
    this.picRegionsDao = picRegionsDao
    this.vidSegmentsDao = vidSegmentsDao
  }

  createSourceExcerptParaphrase(sourceExcerptParaphrase, userId, now) {
    const {
      paraphrasingStatement,
      sourceExcerpt
    } = sourceExcerptParaphrase
    return this.database.query(
      `insert into source_excerpt_paraphrases (paraphrasing_statement_id, source_excerpt_type, source_excerpt_id, creator_user_id, created) 
      values ($1, $2, $3, $4, $5)`,
      [paraphrasingStatement.id, sourceExcerpt.type, sourceExcerpt.entity.id, userId, now]
    )
      .then(mapSingle(toSourceExcerptParaphrase))
  }

  readSourceExcerptParaphraseForId(sourceExcerptParaphraseId) {
    return this.database.query(
      `select * from source_excerpt_paraphrases where source_excerpt_paraphrase_id = $1 and deleted is null`,
      [sourceExcerptParaphraseId]
    )
      .then(mapSingle(this.logger, toSourceExcerptParaphrase, 'source_excerpt_paraphrases', {sourceExcerptParaphraseId}))
  }

  // readSourceExcerptHavingStatementAndSourceExcerpt(statement, sourceExcerpt) {
  //   const paraphrasingStatementId = statement.id
  //   const sourceExcerptId = sourceExcerpt.id
  // }

  readSourceExcerptHavingStatementIdAndSourceExcerptTypeAndId(paraphrasingStatementId, sourceExcerptType, sourceExcerptId) {
    return this.database.query(
      `select * from source_excerpt_paraphrases where paraphrasing_statement_id = $1 and source_excerpt_type = $2 and source_excerpt_id = $3`,
      [paraphrasingStatementId, sourceExcerptType, sourceExcerptId]
    )
      .then(mapSingle(this.logger, toSourceExcerptParaphrase, 'source_excerpt_paraphrases', {paraphrasingStatementId, sourceExcerptId}))
  }
}
