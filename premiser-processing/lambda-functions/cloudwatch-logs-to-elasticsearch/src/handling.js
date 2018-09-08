'use strict'

const elasticsearch = require('elasticsearch')
const {extract, logEventToDocument, indexDocuments} = require('./logTransforms')


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
  const {logEvents, logGroup, logStream} = await extract(event)
  const documents = logEvents.map((logEvent) => logEventToDocument(logEvent, logGroup, logStream))
  const successCount = await indexDocuments(documents, client, elasticsearchIndex, elasticsearchType, elasticsearchBulkTimeout)
  callback(null, {successes: successCount})
}
