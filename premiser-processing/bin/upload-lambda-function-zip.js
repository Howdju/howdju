const fs = require('fs')
const path = require('path')
const AWS = require('aws-sdk')
const {ArgumentParser} = require('argparse')

const {
  logger,
} = require('howdju-ops')

const parser = new ArgumentParser({
  description: "Upload a Lambda function's code to S3"
})
parser.add_argument('--lambdaDir', {required: true})
const args = parser.parse_args()
const lambdaDir = path.resolve('lambda-functions', args.lambdaDir)

const lambdarcPath = path.resolve(lambdaDir, 'lambdarc')
const lambdarc = require(lambdarcPath)
const lambdaName = lambdarc.name

AWS.config.region = 'us-east-1'
const profile = process.env.AWS_PROFILE || 'BuildTools'
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile})
const s3 = new AWS.S3()

const zipPath = path.resolve(`dist/lambda-functions/${lambdaName}/${lambdaName}.zip`)
const params = {Bucket: 'howdju-lambdas', Key: `${lambdaName}/${lambdaName}.zip`, Body: fs.createReadStream(zipPath)}
const options = {partSize: 10 * 2^20, queueSize: 1}
s3.upload(params, options, function(err, data) {
  if (err) throw err
  logger.info(`Successfully uploaded ${zipPath} to ${data.Bucket}/${data.Key} (Etag: ${data.ETag}`)
})
