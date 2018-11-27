const sinon = require('sinon')

const {
  mockLogger
} = require('howdju-test-common')
const {
  SentenceType
} = require('howdju-common')

const {StatementsDao} = require('./StatementsDao')

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
            case 'readStatementWithoutSentenceForId': {
              switch (args[0]) {
                case statementId:
                  return {
                    fields: [
                      {name: 'statement_id'},
                      {name: 'sentence_type'},
                      {name: 'sentence_id'},
                      {name: 'speaker_persorg_id'},
                      {name: 'root_proposition_id'},
                      {name: 'creator_user_id'},
                      {name: 'created'},
                    ],
                    rows: [[
                      statementId,
                      SentenceType.STATEMENT,
                      statement2Id,
                      speakerId,
                      propositionId,
                      creatorUserId,
                      new Date()
                    ]]
                  }
                case statement2Id:
                  return {
                    fields: [
                      {name: 'statement_id'},
                      {name: 'sentence_type'},
                      {name: 'sentence_id'},
                      {name: 'speaker_persorg_id'},
                      {name: 'root_proposition_id'},
                      {name: 'creator_user_id'},
                      {name: 'created'},
                    ],
                    rows: [[
                      statement2Id,
                      SentenceType.PROPOSITION,
                      propositionId,
                      speaker2Id,
                      propositionId,
                      creatorUserId,
                      new Date()
                    ]]
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