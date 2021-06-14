const {
  newImpossibleError,
  requireArgs,
  SentenceType,
} = require('howdju-common')

const {
  statementSchema
} = require('./validationSchemas')
const {EntityService} = require('./EntityService')

module.exports.StatementsService = class StatementsService extends EntityService {

  constructor(logger, authService, statementsDao, persorgsService, propositionsService) {
    requireArgs({logger, authService, statementsDao, persorgsService, propositionsService})
    super(statementSchema, logger, authService)
    this.statementsDao = statementsDao
    this.persorgsService = persorgsService
    this.propositionsService = propositionsService
  }

  async readStatementForId(statementId) {
    return await this.statementsDao.readStatementForId(statementId)
  }

  async doReadOrCreate(statement, userId, now) {
    if (statement.id) {
      return {
        isExtant: true,
        statement: await this.readStatementForId(statement.id)
      }
    }

    const {statements, proposition} = collectSentences(statement)

    let {proposition: prevSentence} = await this.propositionsService.readOrCreateValidPropositionAsUser(proposition, userId, now)

    let isOutmostStatementExtant = false
    const propositionId = prevSentence.id
    for (let i = statements.length - 1; i >= 0; i--) {
      const statementToCreate = statements[i]
      statementToCreate.rootPropositionId = propositionId
      statementToCreate.sentence = prevSentence

      const {persorg} = await this.persorgsService.readOrCreateValidPersorgAsUser(statementToCreate.speaker, userId, now)
      statementToCreate.speaker = persorg

      prevSentence = await this.statementsDao.readEquivalentStatement(statementToCreate)
      if (prevSentence) {
        isOutmostStatementExtant = true
      } else {
        prevSentence = await this.statementsDao.createStatement(statementToCreate, userId, now)
        isOutmostStatementExtant = false
      }
    }

    return {isExtant: isOutmostStatementExtant, statement: prevSentence}
  }

  async readStatementsForSpeakerPersorgId(speakerPersorgId) {
    return await this.statementsDao.readStatementsForSpeakerPersorgId(speakerPersorgId)
  }

  async readStatementsForSentenceTypeAndId(sentenceType, sentenceId) {
    return await this.statementsDao.readStatementsForSentenceTypeAndId(sentenceType, sentenceId)
  }

  async readStatementsForRootPropositionId(rootPropositionId) {
    return await this.statementsDao.readStatementsForRootPropositionId(rootPropositionId)
  }

  async readIndirectStatementsForRootPropositionId(rootPropositionId) {
    return await this.statementsDao.readIndirectStatementsForRootPropositionId(rootPropositionId)
  }
}

function collectSentences(statement) {
  const statements = [statement]
  let proposition = null
  let currStatement = statement
  while (currStatement) {
    switch (currStatement.sentenceType) {
      case SentenceType.STATEMENT:
        statements.push(currStatement.sentence)
        currStatement = currStatement.sentence
        break
      case SentenceType.PROPOSITION:
        proposition = currStatement.sentence
        currStatement = null
        break
      default:
        throw newImpossibleError(`Invalid SentenceType ${currStatement.sentenceType}`)
    }
  }
  return {
    statements,
    proposition,
  }
}
