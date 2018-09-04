process.env = {
  ELASTICSEARCH_HOST: 'host',
  ELASTICSEARCH_INDEX: 'index',
}

const {extract} = require('./handling')

const testLogEvent = {
  "awslogs": {
    "data": "H4sIAAAAAAAAAHWPwQqCQBCGX0Xm7EFtK+smZBEUgXoLCdMhFtKV3akI8d0bLYmibvPPN3wz00CJxmQnTO41whwWQRIctmEcB6sQbFC3CjW3XW8kxpOpP+OC22d1Wml1qZkQGtoMsScxaczKN3plG8zlaHIta5KqWsozoTYw3/djzwhpLwivWFGHGpAFe7DL68JlBUk+l7KSN7tCOEJ4M3/qOI49vMHj+zCKdlFqLaU2ZHV2a4Ct/an0/ivdX8oYc1UVX860fQDQiMdxRQEAAA=="
  }
}

describe('handling', () => {
  describe('extract', () => {
    test('extracts test log event', async () => {
      expect(await extract(testLogEvent)).toEqual({
        "logEvents": [
          {"id": "eventId1", "message": "[ERROR] First test message", "timestamp": 1440442987000},
          {"id": "eventId2", "message": "[ERROR] Second test message", "timestamp": 1440442987001}
        ],
        "logGroup": "testLogGroup",
        "logStream": "testLogStream",
        "messageType": "DATA_MESSAGE",
        "owner": "123456789123",
        "subscriptionFilters": ["testFilter"]
      })
    })
  })
})
