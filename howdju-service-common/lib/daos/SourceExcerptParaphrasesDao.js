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
  toProposition,
} = require('./orm')


exports.SourceExcerptParaphrasesDao = class SourceExcerptParaphrasesDao {
  constructor(logger, database, propositionsDao, writQuotesDao, picRegionsDao, vidSegmentsDao) {
    requireArgs({logger, database, propositionsDao, writQuotesDao, picRegionsDao, vidSegmentsDao})

    this.logger = logger
    this.database = database
    this.propositionsDao = propositionsDao
    this.writQuotesDao = writQuotesDao
    this.picRegionsDao = picRegionsDao
    this.vidSegmentsDao = vidSegmentsDao
  }

  createSourceExcerptParaphrase(sourceExcerptParaphrase, userId, now) {
    const {
      paraphrasingProposition,
      sourceExcerpt
    } = sourceExcerptParaphrase
    return this.database.query(
      `insert into source_excerpt_paraphrases (paraphrasing_proposition_id, source_excerpt_type, source_excerpt_id, creator_user_id, created) 
      values ($1, $2, $3, $4, $5)
      returning *`,
      [paraphrasingProposition.id, sourceExcerpt.type, sourceExcerpt.entity.id, userId, now]
    )
      .then(mapSingle(toSourceExcerptParaphrase))
      .then( (dbSourceExcerptParaphrase) => {
        dbSourceExcerptParaphrase.paraphrasingProposition = paraphrasingProposition
        dbSourceExcerptParaphrase.sourceExcerpt.entity = sourceExcerpt.entity
        return dbSourceExcerptParaphrase
      })
  }

  readSourceExcerptParaphraseForId(sourceExcerptParaphraseId, {userId}) {
    return this.database.query(
      `select * from source_excerpt_paraphrases where source_excerpt_paraphrase_id = $1 and deleted is null`,
      [sourceExcerptParaphraseId]
    )
      .then(mapSingle(this.logger, toSourceExcerptParaphrase, 'source_excerpt_paraphrases', {sourceExcerptParaphraseId}))
  }

  readSourceExcerptHavingPropositionIdAndSourceExcerptTypeAndId(paraphrasingPropositionId, sourceExcerptType, sourceExcerptId) {
    return this.database.query(
      `select * from source_excerpt_paraphrases where paraphrasing_proposition_id = $1 and source_excerpt_type = $2 and source_excerpt_id = $3`,
      [paraphrasingPropositionId, sourceExcerptType, sourceExcerptId]
    )
      .then(mapSingle(this.logger, toSourceExcerptParaphrase, 'source_excerpt_paraphrases', {paraphrasingPropositionId, sourceExcerptId}))
  }

  readSourceExcerptParaphrasesByIdForRootPropositionId(rootPropositionId) {
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
              j.root_proposition_id = $3
          and j.deleted is null
          and jbc.deleted is null
          and sep.deleted is null
    `
    const args = [
      JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
      JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
      rootPropositionId
    ]
    return Promise.all([
      this.database.query(sql, args),
      readParaphrasingPropositionsByIdForRootPropositionId(this.logger, this.database, rootPropositionId),
      this.writQuotesDao.readWritQuotesByIdForRootPropositionId(rootPropositionId),
      this.picRegionsDao.readPicRegionsByIdForRootPropositionId(rootPropositionId),
      this.vidSegmentsDao.readVidSegmentsByIdForRootPropositionId(rootPropositionId),
    ])
      .then(([
        {rows: sourceExcerptParaphraseRows},
        paraphrasingPropositionsById,
        writQuotesById,
        picRegionsById,
        vidSegmentsById,
      ]) => {
        const sourceExcerptParaphrasesById = {}
        forEach(sourceExcerptParaphraseRows, (sourceExcerptParaphraseRow) => {
          const sourceExcerptParaphrase = toSourceExcerptParaphrase(sourceExcerptParaphraseRow)
          sourceExcerptParaphrasesById[sourceExcerptParaphrase.id] = sourceExcerptParaphrase
          sourceExcerptParaphrase.paraphrasingProposition = paraphrasingPropositionsById[sourceExcerptParaphrase.paraphrasingProposition.id]

          switch (sourceExcerptParaphrase.sourceExcerpt.type) {
            case SourceExcerptType.WRIT_QUOTE:
              sourceExcerptParaphrase.sourceExcerpt.entity = writQuotesById[sourceExcerptParaphrase.sourceExcerpt.entity.id]
              break
            case SourceExcerptType.PIC_REGION:
              sourceExcerptParaphrase.sourceExcerpt.entity = picRegionsById[sourceExcerptParaphrase.sourceExcerpt.entity.id]
              break
            case SourceExcerptType.VID_SEGMENT:
              sourceExcerptParaphrase.sourceExcerpt.entity = vidSegmentsById[sourceExcerptParaphrase.sourceExcerpt.entity.id]
              break
            default:
              throw newExhaustedEnumError('SourceExcerptType', sourceExcerptParaphrase.sourceExcerpt.type)
          }
        })
        return sourceExcerptParaphrasesById
      })
  }
}

function readParaphrasingPropositionsByIdForRootPropositionId(logger, database, rootPropositionId) {
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
        join propositions ps on 
              sep.paraphrasing_proposition_id = ps.proposition_id
      where 
            j.root_proposition_id = $3
        and j.deleted is null
        and jbc.deleted is null
        and sep.deleted is null
        and ps.deleted is null
  `
  const args = [
    JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
    JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
    rootPropositionId
  ]
  return database.query(sql, args)
    .then(mapManyById(toProposition))
}
