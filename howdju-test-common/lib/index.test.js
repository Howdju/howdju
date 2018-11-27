const {
  mockLogger
} = require('./index')

describe('mockLogger', () => {
  test('logs without error', () => {
    mockLogger.log('a message')
  })
})
