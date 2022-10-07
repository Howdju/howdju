const Promise = require('bluebird')
const map = require('lodash/map')

const {
  newExhaustedEnumError,
  requireArgs,
  SentenceTypes,
} = require('howdju-common')

const {BaseDao, START_PREFIX} = require('./BaseDao')
const {toStatement} = require('./orm')

module.exports.StatementsDao = class StatementsDao extends BaseDao {
  constructor(logger, database, propositionsDao) {
    requireArgs({logger, database, propositionsDao})
    super(logger, database, toStatement)
    this.propositionsDao = propositionsDao
  }

  async readStatementForId(statementId) {
    const statement = await this.readStatementWithoutSentenceForId(statementId)
    let sentence = statement
    let nextSentenceId = sentence.sentence.id
    while (nextSentenceId) {
      let nextSentence
      switch (sentence.sentenceType) {
        case SentenceTypes.STATEMENT: {
          nextSentence = await this.readStatementWithoutSentenceForId(nextSentenceId)
          nextSentenceId = nextSentence.sentence.id
          break
        }
        case SentenceTypes.PROPOSITION: {
          nextSentence = await this.propositionsDao.readPropositionForId(nextSentenceId)
          nextSentenceId = null
          break
        }
        default:
          throw newExhaustedEnumError('SentenceTypes', sentence.sentenceType)
      }
      sentence.sentence = nextSentence
      sentence = nextSentence
    }

    return statement
  }

  async readEquivalentStatement(statement) {
    return await this.queryOne(
      'readEquivalentStatement',
      `
        with
          extant_users as (select * from users where deleted is null)
          , extant_persorgs as (select * from persorgs where deleted is null)
        select
            s.*
          , '' as ${START_PREFIX}creator_
          , u.*
          , '' as ${START_PREFIX}speaker_
          , p.*
        from statements s
          left join extant_users u on s.creator_user_id = u.user_id
          left join extant_persorgs p on s.speaker_persorg_id = p.persorg_id
          where
                s.speaker_persorg_id = $1
            and s.sentence_type = $2
            and s.sentence_id = $3
            and s.deleted is null
      `,
      [statement.speaker.id, statement.sentenceType, statement.sentence.id]
    )
  }

  async createStatement(statement, creatorUserId, now) {
    return await this.queryOne(
      'createStatement',
      `
        insert into statements
          (sentence_type, sentence_id, speaker_persorg_id, root_proposition_id, creator_user_id, created)
          values ($1, $2, $3, $4, $5, $6)
          returning *
      `,
      [statement.sentenceType, statement.sentence.id, statement.speaker.id, statement.rootPropositionId,
        creatorUserId, now]
    )
  }

  async readStatementWithoutSentenceForId(statementId) {
    return await this.queryOne(
      'readStatementWithoutSentenceForId',
      `
        with
            extant_users as (select * from users where deleted is null)
          , extant_persorgs as (select * from persorgs where deleted is null)
        select
            s.*
          , '' as _prefix__creator_
          , u.*
          , '' as _prefix__speaker_
          , p.*
        from statements s
          left join extant_users u on s.creator_user_id = u.user_id
          left join extant_persorgs p on s.speaker_persorg_id = p.persorg_id
          where s.statement_id = $1 and s.deleted is null
      `,
      [statementId]
    )
  }

  async readStatementsForSpeakerPersorgId(speakerPersorgId) {
    const {rows} = await this.database.query(
      'readStatementsForSpeakerPersorgId.statementIds',
      'select * from statements s where s.speaker_persorg_id = $1 and s.deleted is null',
      [speakerPersorgId]
    )
    return await Promise.all(map(rows, (row) => this.readStatementForId(row.statement_id)))
  }

  async readStatementsForSentenceTypeAndId(sentenceType, sentenceId) {
    const {rows} = await this.database.query(
      'readStatementsForSentenceTypeAndId.statementIds',
      'select * from statements s where s.sentence_type = $1 and s.sentence_id = $2 and s.deleted is null',
      [sentenceType, sentenceId]
    )
    return await Promise.all(map(rows, (row) => this.readStatementForId(row.statement_id)))
  }

  async readStatementsForRootPropositionId(rootPropositionId) {
    const {rows} = await this.database.query(
      'readStatementsForRootPropositionId.statementIds',
      'select * from statements s where s.root_proposition_id = $1 and s.deleted is null',
      [rootPropositionId]
    )
    return await Promise.all(map(rows, (row) => this.readStatementForId(row.statement_id)))
  }

  async readIndirectStatementsForRootPropositionId(rootPropositionId) {
    const {rows} = await this.database.query(
      'readIndirectStatementsForRootPropositionId.statementIds',
      `select * from statements s
         where
               s.root_proposition_id = $1
           and s.sentence_type <> $2
           and s.deleted is null`,
      [rootPropositionId, SentenceTypes.PROPOSITION]
    )
    return await Promise.all(map(rows, (row) => this.readStatementForId(row.statement_id)))
  }
}
