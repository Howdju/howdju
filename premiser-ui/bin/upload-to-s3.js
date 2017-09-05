const {ArgumentParser} = require('argparse')
const AWS = require('aws-sdk')
const debug = require('debug')('premiser-ui:upload-to-s3')
const fs = require('fs')
const moment = require('moment')
const path = require('path')

const {
  utcNow
} = require('howdju-common')


const projectConfig = require('../config/project.config')

const argParser = new ArgumentParser({
  description: 'Upload the app to S3'
})
argParser.addArgument('bucket')
const args = argParser.parseArgs()

AWS.config.region = projectConfig.aws.region
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: projectConfig.aws.profile})
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
  fs.readFile(projectConfig.paths.dist(filename), (err, data) => {
    if (err) throw err

    const extension = path.extname(filename)
    const duration = moment.duration(projectConfig.aws.cacheDuration)
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
    const params = {
      Bucket: args.bucket,
      Key: filename,
      Body: data,
      ACL: 'public-read',
      CacheControl: `public, max-age=${duration.seconds()}`,
      Expires: utcNow().add(duration).toDate(),
      ContentType: contentTypes[extension] || 'application/octet-stream',
    }
    s3.upload(params, function(err, data) {
      if (err) throw err
      debug(`Uploaded ${filename} to ${args.bucket} (ETag: ${data.ETag})`)
    })
  })
}


fs.readdir(projectConfig.paths.dist(), (err, files) => {
  files.forEach(file => {
    upload(file)
  })
})