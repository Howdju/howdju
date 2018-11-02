const sinon = require('sinon')

const {
  SentenceType
} = require('howdju-common')

const {StatementsDao} = require('./StatementsDao')
const {mockLogger} = require('../util')

describe('StatementsDao', () => {
  describe('readStatementForId', () => {
    test('works', async () => {


      const statementId = 'statementId'
      const statement2Id = 'statement2Id'
      const propositionId = 'propositionId'
      const propositionText = 'This is proposed.'

      const speakerId = 'speakerId'
      const speaker2Id = 'speaker2Id'
      const creatorUserId = 'creatorUserId'

      const database = {
        query: sinon.fake((queryName, sql, args) => {
          switch (queryName) {
            case 'readJustStatementForId': {
              switch (args[0]) {
                case statementId:
                  return {
                    fields: [],
                    rows: [{
                      statement_id: statementId,
                      sentence_type: SentenceType.STATEMENT,
                      sentence_id: statement2Id,
                      speaker_persorg_id: speakerId,
                      root_proposition_id: propositionId,
                      creator_user_id: creatorUserId,
                      created: new Date()
                    }]
                  }
                case statement2Id:
                  return {
                    fields: [],
                    rows: [{
                      statement_id: statement2Id,
                      sentence_type: SentenceType.PROPOSITION,
                      sentence_id: propositionId,
                      speaker_persorg_id: speaker2Id,
                      root_proposition_id: propositionId,
                      creator_user_id: creatorUserId,
                      created: new Date()
                    }]
                  }
              }
              break
            }
          }
        })
      }

      const propositionsDao = {
        readPropositionForId: sinon.fake(() => ({
          id: propositionId,
          text: propositionText,
        }))
      }

      const statementsDao = new StatementsDao(mockLogger, database, propositionsDao)

      expect(await statementsDao.readStatementForId(statementId)).toMatchObject({
        id: statementId,
        sentenceType: SentenceType.STATEMENT,
        sentence: {
          id: statement2Id,
          sentenceType: SentenceType.PROPOSITION,
          sentence: {
            id: propositionId,
            text: propositionText,
          }
        }
      })
    })
  })
})