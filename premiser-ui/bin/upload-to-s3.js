const {ArgumentParser} = require('argparse')
const AWS = require('aws-sdk')
const debug = require('debug')('premiser-ui:upload-to-s3')
const fs = require('fs')
const moment = require('moment')
const path = require('path')

const {
  utcNow,
  gitCommitMetadataKey,
} = require('howdju-common')
const {
  gitSha,
} = require('howdju-ops')
const packageInfo = require('../package.json')

const versionMetadataKey = 'howdju-ui-version'
const projectConfig = require('../config/project.config')

const argParser = new ArgumentParser({
  description: 'Upload the web app to S3'
})
argParser.add_argument('bucket')
argParser.add_argument('--filter')
const args = argParser.parse_args()
const filter = args.filter && new RegExp(args.filter)

debug(`${argParser} ${args}`)

const s3 = new AWS.S3({apiVersion: '2006-03-01'})

const contentTypes = {
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.html': 'text/html',
  '.css': 'text/css',
  '.map': 'application/octet-stream',
}

const upload = (filename) => {
  debug(`Uploading ${filename}`)
  fs.readFile(projectConfig.paths.dist(filename), (err, data) => {
    if (err) throw err

    const extension = path.extname(filename)
    const duration = moment.duration(projectConfig.aws.cacheDuration)
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
    const params = {
      Bucket: args.bucket,
      Key: filename,
      Body: data,
      Metadata: {
        [gitCommitMetadataKey]: gitSha(),
        [versionMetadataKey]: packageInfo.version,
      },
      ACL: 'public-read',
      CacheControl: `public, max-age=${duration.seconds()}`,
      Expires: utcNow().add(duration).toDate(),
      ContentType: contentTypes[extension] || 'application/octet-stream',
    }
    s3.upload(params, function(err, data) {
      if (err) {
        debug(`Error uploading ${filename}: ${err}`)
        throw err
      }
      debug(`Uploaded ${filename} to ${args.bucket} (ETag: ${data.ETag})`)
    })
  })
}

walkRelative(projectConfig.paths.dist(), upload)

function walk(dirPath, action) {
  fs.readdir(dirPath, function(err, fileNames) {
    if (err) return debug(err)

    fileNames.forEach(function(fileName) {
      if (fileName[0] === '.') {
        return debug(`Skipping ${fileName}`)
      }
      const filePath = path.resolve(dirPath, fileName)
      fs.stat(filePath, function(err, stat) {
        if (stat && stat.isDirectory()) {
          return walk(filePath, action)
        }
        return action(filePath)
      })
    })
  })
}

function walkRelative(dirPath, action) {
  const absPath = path.resolve(dirPath)
  walk(dirPath, function truncatePath(filePath) {
    // +1 to get the directory separator
    const relativePath = filePath.substring(absPath.length + 1)
    if (!filter || !filter.test(relativePath)) {
      action(relativePath)
    }
  })
}
