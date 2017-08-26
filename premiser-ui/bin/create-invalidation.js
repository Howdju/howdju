const {ArgumentParser} = require('argparse')
const AWS = require('aws-sdk')
const debug = require('debug')('premiser-ui:upload-to-s3')
const fs = require('fs')
const uuid = require('uuid')


const projectConfig = require('../config/project.config')

const argParser = new ArgumentParser({
  description: 'Create a Cloudfront invalidation'
})
argParser.addArgument('distributionId')
const args = argParser.parseArgs()

AWS.config.region = projectConfig.aws.region
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: projectConfig.aws.profile});
const cloudfront = new AWS.CloudFront({apiVersion: '2017-03-25'});

const items = [
  '/index.html',
  '/error.html',
  '/android-chrome-192x192.png',
  '/android-chrome-256x256.png',
  '/apple-touch-icon.png',
  '/browserconfig.xml',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/manifest.json',
  '/mstile-150x150.png',
  '/safari-pinned-tab.svg',
]
const invalidate = () => {
  const reference = uuid.v4()
  const params = {
    DistributionId: args.distributionId,
    InvalidationBatch: {
      CallerReference: reference,
      Paths: {
        Quantity: items.length,
        Items: items
      }
    }
  };
  debug(`Invalidating ${args.distributionId} (reference: ${reference}...`)
  cloudfront.createInvalidation(params, function(err, data) {
    if (err) throw err
    else {
      debug(`Successfully invalidated distribution ${args.distributionId} (Invalidation.Id: ${data.Invalidation.Id}; CallerReference: ${reference})`)
    }
  });
}

invalidate()