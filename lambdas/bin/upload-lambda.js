const fs = require('fs')
const path = require('path')
const AWS = require('aws-sdk')
const cliProgress = require('cli-progress')

const {
  gitCommitMetadataKey,
} = require('howdju-common')
const {
  gitSha,
  logger,
} = require('howdju-ops')

// Assume we are run from the lambda package root
const packagePath = process.cwd()
const packageInfoPath = path.resolve(packagePath, 'package.json')
const packageInfo = JSON.parse(fs.readFileSync(packageInfoPath))
const lambdaName = packageInfo.name

const zipPath = path.resolve(packagePath, 'dist/lambda.zip')
const Bucket = 'howdju-lambdas'
const Key = `${lambdaName}/${lambdaName}-${packageInfo.version}.zip`

const zipSize = fs.statSync(zipPath).size
const progress = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic)
progress.start(zipSize, 0)

const upload = new AWS.S3.ManagedUpload({
  partSize: 10 * 2^20,  // 10 MB
  queueSize: 1,
  params: {
    Bucket,
    Key,
    Body: fs.createReadStream(zipPath),
    Metadata: {
      [gitCommitMetadataKey]: gitSha(),
    },
  },
})
upload.on('httpUploadProgress', ({loaded, total}) => {
  progress.update(loaded)
})
upload.send(function(err, data) {
  if (err) throw err
  progress.stop()
  logger.info(`Successfully uploaded ${zipPath} to ${data.Bucket}/${data.Key} (Etag: ${data.ETag})`)
})
