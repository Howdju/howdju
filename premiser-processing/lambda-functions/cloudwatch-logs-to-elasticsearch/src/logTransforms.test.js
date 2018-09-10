process.env = {
  ELASTICSEARCH_HOST: 'host',
  ELASTICSEARCH_INDEX: 'index',
}

const {extract, logEventToDocument} = require('./logTransforms')

const testLogEvent = {
  "awslogs": {
    "data": "H4sIAAAAAAAAAHWPwQqCQBCGX0Xm7EFtK+smZBEUgXoLCdMhFtKV3akI8d0bLYmibvPPN3wz00CJxmQnTO41whwWQRIctmEcB6sQbFC3CjW3XW8kxpOpP+OC22d1Wml1qZkQGtoMsScxaczKN3plG8zlaHIta5KqWsozoTYw3/djzwhpLwivWFGHGpAFe7DL68JlBUk+l7KSN7tCOEJ4M3/qOI49vMHj+zCKdlFqLaU2ZHV2a4Ct/an0/ivdX8oYc1UVX860fQDQiMdxRQEAAA=="
  }
}

const timestampRegExp = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z/

describe('logTransforms', () => {
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

  describe('logEventToDocument', () => {

    test('creates document for start phase logEvent', () => {
      const logGroupName = 'log-group-name'
      const logStreamName = 'log-stream-name'
      const logEventId = 'log-event-id'
      const logEventTimestamp = 'log-event-timestamp'

      const lambdaFunctionPhase = 'START'
      const serverRequestId = 'd0d91210-b21e-11e8-95bb-83bf50174482'
      const lambdaFunctionVersion = '82'
      const logEventMessage = `${lambdaFunctionPhase} RequestId: ${serverRequestId} Version: ${lambdaFunctionVersion}`

      const logEvent = {
        id: logEventId,
        timestamp: logEventTimestamp,
        message: logEventMessage,
      }
      expect(logEventToDocument(logEvent, logGroupName, logStreamName)).toEqual(expect.objectContaining({
        logGroupName,
        logStreamName,
        logEventId,
        logEventTimestamp,
        logEventMessage,
        lambdaFunctionPhase,
        serverRequestId,
        lambdaFunctionVersion,
        ingestTimestamp: expect.stringMatching(timestampRegExp),
      }))
    })

    test('creates document for end phase logEvent', () => {
      const logGroupName = 'log-group-name'
      const logStreamName = 'log-stream-name'
      const logEventId = 'log-event-id'
      const logEventTimestamp = 'log-event-timestamp'

      const lambdaFunctionPhase = 'END'
      const serverRequestId = 'd0d91210-b21e-11e8-95bb-83bf50174482'
      const logEventMessage = `${lambdaFunctionPhase} RequestId: ${serverRequestId}`

      const logEvent = {
        id: logEventId,
        timestamp: logEventTimestamp,
        message: logEventMessage,
      }
      expect(logEventToDocument(logEvent, logGroupName, logStreamName)).toEqual(expect.objectContaining({
        logGroupName,
        logStreamName,
        logEventId,
        logEventTimestamp,
        logEventMessage,
        lambdaFunctionPhase,
        serverRequestId,
        ingestTimestamp: expect.stringMatching(timestampRegExp),
      }))
    })

    test('creates document for report phase logEvent', () => {
      const logGroupName = 'log-group-name'
      const logStreamName = 'log-stream-name'
      const logEventId = 'log-event-id'
      const logEventTimestamp = 'log-event-timestamp'

      const lambdaFunctionPhase = 'REPORT'
      const serverRequestId = 'd0d91210-b21e-11e8-95bb-83bf50174482'
      const lambdaFunctionDurationMs = 541.47
      const lambdaFunctionBilledDurationMs = 600
      const lambdaFunctionMemorySizeMb = 128
      const lambdaFunctionMaxMemoryUsedMb = 56
      const logEventMessage =
        `${lambdaFunctionPhase} RequestId: ${serverRequestId} Duration: ${lambdaFunctionDurationMs} ms`
        + ` Billed Duration: ${lambdaFunctionBilledDurationMs} ms Memory Size: ${lambdaFunctionMemorySizeMb} MB`
        + ` Max Memory Used: ${lambdaFunctionMaxMemoryUsedMb} MB `

      const logEvent = {
        id: logEventId,
        timestamp: logEventTimestamp,
        message: logEventMessage,
      }
      expect(logEventToDocument(logEvent, logGroupName, logStreamName)).toEqual(expect.objectContaining({
        logGroupName,
        logStreamName,
        logEventId,
        logEventTimestamp,
        logEventMessage,
        lambdaFunctionPhase,
        serverRequestId,
        lambdaFunctionDurationMs,
        lambdaFunctionBilledDurationMs,
        lambdaFunctionMemorySizeMb,
        lambdaFunctionMaxMemoryUsedMb,
        ingestTimestamp: expect.stringMatching(timestampRegExp),
      }))
    })

    test('creates document for basic logger logEvent', () => {
      const logGroupName = 'log-group-name'
      const logStreamName = 'log-stream-name'
      const logEventId = 'log-event-id'
      const logEventTimestamp = 'log-event-timestamp'

      const timestamp = '2018-09-08T03:28:47.240Z'
      const logLevel = 'info'
      const logLevelNumber = 2
      const message = 'Loading app config file: ../config/config.production.js'
      const logEventMessage = `{ "timestamp": "${timestamp}", "level": "${logLevel}", "levelNumber": ${logLevelNumber}, "message": "${message}" }`

      const logEvent = {
        id: logEventId,
        timestamp: logEventTimestamp,
        message: logEventMessage,
      }
      expect(logEventToDocument(logEvent, logGroupName, logStreamName)).toEqual(expect.objectContaining({
        logGroupName,
        logStreamName,
        logEventId,
        logEventTimestamp,
        logEventMessage,
        timestamp,
        logLevel,
        logLevelNumber,
        message,
        ingestTimestamp: expect.stringMatching(timestampRegExp),
      }))
    })

    test('creates document for logger logEvent', () => {
      const logGroupName = 'log-group-name'
      const logStreamName = 'log-stream-name'
      const logEventId = 'log-event-id'
      const logEventTimestamp = 'log-event-timestamp'

      const timestamp = '2018-09-06T21:50:06.267Z'
      const clientRequestId = '6b8431d4-3980-4d2f-b1f6-035ff14bc96a'
      const serverRequestId = 'd0d8763a-b21e-11e8-beb0-a9b0cd0989a5'
      const stage = 'pre_prod'
      const logLevel = 'silly'
      const logLevelNumber = 5
      const message = 'Response'
      const data = {
        response: {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "http://pre-prod-www.howdju.com",
            "Access-Control-Allow-Headers": "Content-Type,Content-Encoding,Authorization,Request-ID,Session-Storage-ID,Page-Load-ID",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Expires": "0",
            "Pragma": "no-cache",
            "Vary": "Origin",
            "Content-Type": "application/json"
          },
          // technically bodies are JSON for AWS, although for this test either JSON or not here should work
          body: JSON.stringify({
            statements: [
              {
                id: 1536,
                text: "NASA awarded SpaceX a $1.6B contract to supply the International Space Station at the end of 2008",
                normalText: "nasa awarded spacex a 16b contract to supply the international space station at the end of 2008",
                slug: "nasa-awarded-spacex-a-16b-contract-to-supply-the-international-space-station-at-the-end-of-2008",
                created: "2018-07-01T03:48:50.393Z"
              }
            ]
          })
        }
      }
      const logEventMessage = `{"timestamp":"${timestamp}","context":{"clientRequestId":"${clientRequestId}",`
        + `"serverRequestId":"${serverRequestId}","stage":"${stage}"},"level":"${logLevel}",`
        + `"levelNumber":${logLevelNumber},"message":"${message}","data":${JSON.stringify(data)}}`

      const logEvent = {
        id: logEventId,
        timestamp: logEventTimestamp,
        message: logEventMessage,
      }
      expect(logEventToDocument(logEvent, logGroupName, logStreamName)).toEqual(expect.objectContaining({
        logGroupName,
        logStreamName,
        logEventId,
        logEventTimestamp,
        logEventMessage,
        timestamp,
        clientRequestId,
        serverRequestId,
        stage,
        logLevel,
        logLevelNumber,
        message,
        data,
        ingestTimestamp: expect.stringMatching(timestampRegExp),
      }))
    })

  })
})
