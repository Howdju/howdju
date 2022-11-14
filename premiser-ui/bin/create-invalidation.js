const {ArgumentParser} = require('argparse')
const AWS = require('aws-sdk')
const debug = require('debug')('premiser-ui:upload-to-s3')
const uuid = require('uuid')

const argParser = new ArgumentParser({
  description: 'Create a Cloudfront invalidation',
})
argParser.add_argument('distributionId')
const args = argParser.parse_args()

const cloudfront = new AWS.CloudFront({apiVersion: '2017-03-25'})

const invalidate = () => {
  const reference = uuid.v4()
  const params = {
    DistributionId: args.distributionId,
    InvalidationBatch: {
      CallerReference: reference,
      Paths: {
        Quantity: 1,
        // Invalidate everything.
        Items: ['/*'],
      },
    },
  }
  debug(`Invalidating ${args.distributionId} (reference: ${reference}...`)
  cloudfront.createInvalidation(params, function(err, data) {
    if (err) throw err
    else {
      debug(`Successfully invalidated distribution ${args.distributionId} (Invalidation.Id: ${data.Invalidation.Id}; CallerReference: ${reference})`)
    }
  })
}

invalidate()
