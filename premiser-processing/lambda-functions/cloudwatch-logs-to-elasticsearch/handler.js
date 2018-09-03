'use strict'

const zlib = require('zlib')
const elasticsearch = require('elasticsearch')

const {logger} = require('howdju-ops')

const elasticsearchHost = process.env.ELASTICSEARCH_HOST
if (!elasticsearchHost) throw new Error('ELASTICSEARCH_HOST is required')

const elasticsearchIndex = process.env.ELASTICSEARCH_INDEX
if (!elasticsearchIndex) throw new Error('ELASTICSEARCH_INDEX is required')

const client = new elasticsearch.Client({
  host: elasticsearchHost,
  log: process.env.ELASTICSEARCH_LOG_LEVEL
})

function logEventToDocument(logEvent, logGroupName, logStreamName) {
  return {
    logGroupName,
    logStreamName,
    timestamp: logEvent.timestamp,
    message: logEvent.message,
    ingestTimestamp: new Date().toISOString(),
  }
}

const actionTypeNames = [
  'index',
  'create',
  'update',
  'delete',
]
function extractResponseFailures(responseItems) {
  const failures = []
  for (const responseItem of responseItems) {
    let actionTypeName = null
    let actionResult = null
    for (const name of actionTypeNames) {
      const result = responseItem[name]
      if (result) {
        actionTypeName = name
        actionResult = result
        break
      }
    }
    if (!actionResult) {
      throw new Error(`Elasticsearch bulk response item lacks expected property: ${JSON.stringify(responseItem)}`)
    }

    if (actionResult['_shards']['failed'] > 0) {
      failures.push({[actionTypeName]: actionResult})
    }
  }
  return failures
}

function logResponse(response) {
  if (!response.errors) {
    logger.info(`Successfully indexed all ${response.items.length} log events`)
  } else {
    const failures = extractResponseFailures(response.items)
    logger.info(`Successfully logged only ${response.items.length - failures.length}` +
      ` out of ${response.items.length} log events.  Failures: ${JSON.stringify(failures)}`)
  }
}

async function indexDocuments(parsedEvents) {
  // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
  const bulkRecords = []
  for (const event of parsedEvents) {
    bulkRecords.push({ "index" : { "_index" : elasticsearchIndex, "_id" : event.requestId } })
    bulkRecords.push(event)
  }
  const response = await client.bulk({
    body: bulkRecords
  })
  logResponse(response)
}

module.exports.handler = async (event, context) => {
  const data = new Buffer(event.awslogs.data, 'base64')
  const unzippedData = await zlib.gunzip(data)
  const {logEvents, logGroup, logStream} = JSON.parse(unzippedData.toString('utf-8'))
  const documents = logEvents.map((logEvent) => logEventToDocument(logEvent, logGroup, logStream))
  await indexDocuments(documents)
}
