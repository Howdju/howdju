const Promise = require('bluebird')
const forEach = require('lodash/forEach')

const {
  requireArgs,
  SourceExcerptType,
  JustificationBasisType,
  JustificationBasisCompoundAtomType,
  newExhaustedEnumError,
} = require('howdju-common')

const {
  mapSingle,
  mapManyById,
} = require('./util')
const {
  toSourceExcerptParaphrase,
  toStatement,
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
      values ($1, $2, $3, $4, $5)
      returning *`,
      [paraphrasingStatement.id, sourceExcerpt.type, sourceExcerpt.entity.id, userId, now]
    )
      .then(mapSingle(toSourceExcerptParaphrase))
      .then( (dbSourceExcerptParaphrase) => {
        dbSourceExcerptParaphrase.paraphrasingStatement = paraphrasingStatement
        dbSourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerpt.entity
        return dbSourceExcerptParaphrase
      })
  }

  readSourceExcerptParaphraseForId(sourceExcerptParaphraseId) {
    return this.database.query(
      `select * from source_excerpt_paraphrases where source_excerpt_paraphrase_id = $1 and deleted is null`,
      [sourceExcerptParaphraseId]
    )
      .then(mapSingle(this.logger, toSourceExcerptParaphrase, 'source_excerpt_paraphrases', {sourceExcerptParaphraseId}))
  }

  readSourceExcerptHavingStatementIdAndSourceExcerptTypeAndId(paraphrasingStatementId, sourceExcerptType, sourceExcerptId) {
    return this.database.query(
      `select * from source_excerpt_paraphrases where paraphrasing_statement_id = $1 and source_excerpt_type = $2 and source_excerpt_id = $3`,
      [paraphrasingStatementId, sourceExcerptType, sourceExcerptId]
    )
      .then(mapSingle(this.logger, toSourceExcerptParaphrase, 'source_excerpt_paraphrases', {paraphrasingStatementId, sourceExcerptId}))
  }

  readSourceExcerptParaphrasesByIdForRootStatementId(rootStatementId) {
    const sql = `
      select
        sep.*
      from justifications j 
          join justification_basis_compounds jbc on
                j.basis_type = $1
            and j.basis_id = jbc.justification_basis_compound_id
          join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
          join source_excerpt_paraphrases sep on
                jbca.entity_type = $2
            and jbca.entity_id = sep.source_excerpt_paraphrase_id
        where 
              j.root_statement_id = $3
          and j.deleted is null
          and jbc.deleted is null
          and sep.deleted is null
    `
    const args = [
      JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
      JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
      rootStatementId
    ]
    return Promise.all([
      this.database.query(sql, args),
      readParaphrasingStatementsByIdForRootStatementId(this.logger, this.database, rootStatementId),
      this.writQuotesDao.readWritQuotesByIdForRootStatementId(rootStatementId),
      this.picRegionsDao.readPicRegionsByIdForRootStatementId(rootStatementId),
      this.vidSegmentsDao.readVidSegmentsByIdForRootStatementId(rootStatementId),
    ])
      .then( ([{rows: sourceExcerptParaphraseRows}, paraphrasingStatementsById, writQuotesById, picRegionsById, vidSegmentsById]) => {
        const sourceExcerptParaphrasesById = {}
        forEach(sourceExcerptParaphraseRows, (sourceExcerptParaphraseRow) => {
          const sourceExcerptParaphrase = toSourceExcerptParaphrase(sourceExcerptParaphraseRow)
          sourceExcerptParaphrasesById[sourceExcerptParaphrase.id] = sourceExcerptParaphrase
          sourceExcerptParaphrase.paraphrasingStatement = paraphrasingStatementsById[sourceExcerptParaphrase.paraphrasingStatement.id]

          switch (sourceExcerptParaphrase.sourceExcerpt.type) {
            case SourceExcerptType.WRIT_QUOTE:
              sourceExcerptParaphrase.sourceExcerpt.entity = writQuotesById[sourceExcerptParaphrase.sourceExcerpt.id]
              break
            case SourceExcerptType.PIC_REGION:
              sourceExcerptParaphrase.sourceExcerpt.entity = picRegionsById[sourceExcerptParaphrase.sourceExcerpt.id]
              break
            case SourceExcerptType.VID_SEGMENT:
              sourceExcerptParaphrase.sourceExcerpt.entity = vidSegmentsById[sourceExcerptParaphrase.sourceExcerpt.id]
              break
            default:
              throw newExhaustedEnumError('SourceExcerptType', sourceExcerptParaphrase.sourceExcerpt.type)
          }
        })
        return sourceExcerptParaphrasesById
      })
  }
}

function readParaphrasingStatementsByIdForRootStatementId(logger, database, rootStatementId) {
  const sql = `
    select
      ps.*
    from justifications j 
        join justification_basis_compounds jbc on
              j.basis_type = $1
          and j.basis_id = jbc.justification_basis_compound_id
        join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
        join source_excerpt_paraphrases sep on
              jbca.entity_type = $2
          and jbca.entity_id = sep.source_excerpt_paraphrase_id
        join statements ps on 
              sep.paraphrasing_statement_id = ps.statement_id
      where 
            j.root_statement_id = $3
        and j.deleted is null
        and jbc.deleted is null
        and sep.deleted is null
        and ps.deleted is null
  `
  const args = [
    JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
    JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
    rootStatementId
  ]
  return database.query(sql, args)
    .then(mapManyById(toStatement))
}
