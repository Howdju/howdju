'use strict'

const Promise = require('bluebird')
const zlib = Promise.promisifyAll(require('zlib'))
const elasticsearch = require('elasticsearch')

const logger = require('./logger')


const elasticsearchAuthority = process.env.ELASTICSEARCH_AUTHORITY
if (!elasticsearchAuthority) throw new Error('ELASTICSEARCH_AUTHORITY is required')

const elasticsearchIndex = process.env.ELASTICSEARCH_INDEX
if (!elasticsearchIndex) throw new Error('ELASTICSEARCH_INDEX is required')

const elasticsearchType = process.env.ELASTICSEARCH_TYPE
if (!elasticsearchType) throw new Error('ELASTICSEARCH_TYPE is required')

const elasticsearchBulkTimeout = process.env.ELASTICSEARCH_BULK_TIMEOUT || '10s'

const client = new elasticsearch.Client({
  host: elasticsearchAuthority,
  log: process.env.ELASTICSEARCH_LOG_LEVEL
})


module.exports.handler = async (event, context, callback) => {
  const {logEvents, logGroup, logStream} = await module.exports.extract(event)
  const documents = logEvents.map((logEvent) => logEventToDocument(logEvent, logGroup, logStream))
  const successCount = await indexDocuments(documents)
  callback(null, {successes: successCount})
}

module.exports.extract = async function extract(event) {
  const data = new Buffer(event.awslogs.data, 'base64')
  const unzippedData = await zlib.gunzipAsync(data)
  return JSON.parse(unzippedData.toString('ascii'))
}

function logEventToDocument(logEvent, logGroupName, logStreamName) {
  return {
    logGroupName,
    logStreamName,
    logEventId: logEvent.id,
    logEventTimestamp: logEvent.timestamp,
    logEventMessage: logEvent.message,
    ingestTimestamp: new Date().toISOString(),
  }
}

async function indexDocuments(parsedEvents) {
  // https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html
  const bulkRecords = []
  for (const event of parsedEvents) {
    bulkRecords.push({ "index" : { _index : elasticsearchIndex, _type: elasticsearchType, _id : event.requestId } })
    bulkRecords.push(event)
  }
  const response = await client.bulk({
    body: bulkRecords,
    timeout: elasticsearchBulkTimeout,
  })
  return logResponse(response)
}

function logResponse(response) {
  let successCount
  if (!response.errors) {
    successCount = response.items.length
    logger.debug(`Successfully indexed all ${successCount} log events`)
  } else {
    const failures = extractResponseFailures(response.items)
    successCount = response.items.length - failures.length
    logger.error(`Successfully logged only ${successCount} out of ${response.items.length} log events.` +
      `  Failures: ${JSON.stringify(failures)}`)
  }
  return successCount
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
