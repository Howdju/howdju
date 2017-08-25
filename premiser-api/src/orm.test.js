const {
  toStatement,
  toJustification,
  toCitation,
  toVote,
} = require('./orm')
const _ = require('lodash')

describe('orm', () => {

  test('toVote', () => {
    const voteId = '100',
        polarity = 'POSITIVE',
        targetType = 'STATEMENT',
        targetId = 200
    const row = {
      vote_id: voteId,
      polarity,
      target_type: targetType,
      target_id: targetId
    }
    const expectedEntity = {
      id: voteId,
      polarity,
      targetType,
      targetId,
    }
    expect(toVote(row)).toEqual(expectedEntity)
  })
})
