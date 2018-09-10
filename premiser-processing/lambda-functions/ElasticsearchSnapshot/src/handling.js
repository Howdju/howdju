'use strict'

const elasticsearch = require('elasticsearch')

const {SnapshotsService} = require('./snapshots-service')

let snapshotsService

module.exports.handler = async (event, context, callback) => {
  if (!snapshotsService) {
    snapshotsService = createSnapshotsService()
  }
  callback(null, await snapshotsService.dispatchEvent(event))
}

function createSnapshotsService() {
  const elasticsearchAuthority = process.env.ELASTICSEARCH_AUTHORITY
  if (!elasticsearchAuthority) throw new Error('ELASTICSEARCH_AUTHORITY is required')

  const elasticsearchClient = new elasticsearch.Client({
    host: elasticsearchAuthority,
    log: process.env.ELASTICSEARCH_LOG_LEVEL
  })

  const s3Bucket = process.env.S3_BUCKET
  if (!s3Bucket) throw new Error('S3_BUCKET is required')

  const masterTimeout = process.env.ELASTICSEARCH_MASTER_TIMEOUT || '10s'
  const timeout = process.env.ELASTICSEARCH_TIMEOUT || '10s'

  return new SnapshotsService(elasticsearchClient, s3Bucket, masterTimeout, timeout)
}