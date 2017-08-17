const AWS = require('aws-sdk')
const debug = require('debug')('premiser-ui:upload-to-s3')
const fs = require('fs')
const uuid = require('uuid');


const projectConfig = require('../config/project.config')

AWS.config.region = projectConfig.aws.region
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: projectConfig.aws.profile});
const cloudfront = new AWS.CloudFront({apiVersion: '2017-03-25'});

const distributionId = projectConfig.aws.distributionId
if (!distributionId) {
  throw new Error("distributionId is required")
}
const items = [
  '/index.html',
]
const invalidate = () => {
  const reference = uuid.v4()
  const params = {
    DistributionId: distributionId,
    InvalidationBatch: {
      CallerReference: reference,
      Paths: {
        Quantity: items.length,
        Items: items
      }
    }
  };
  debug(`Invalidating ${distributionId} (reference: ${reference}...`)
  cloudfront.createInvalidation(params, function(err, data) {
    if (err) throw err
    else {
      debug(`Successfully invalidated ${distributionId} (invalidation: ${data.Invalidation.Id}; caller reference: ${reference})`)
    }
  });
}

invalidate()