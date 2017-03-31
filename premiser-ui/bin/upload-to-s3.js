const AWS = require('aws-sdk')
const debug = require('debug')('premiser-ui:upload-to-s3')
const fs = require('fs')
const path = require('path')
const moment = require('moment');


const projectConfig = require('../config/project.config')

AWS.config.region = 'us-east-1'
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'premiser'});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

const contentTypes = {
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.map': 'application/octet-stream',
}

const bucket = 'www.premiser.co'

const upload = (filename) => {
  fs.readFile(projectConfig.paths.dist(filename), (err, data) => {
    if (err) throw err

    const extension = path.extname(filename)
    const duration = moment.duration(10, 'minutes')
    // const timezone = 'America/New_York'
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
    const params = {
      Bucket: bucket,
      Key: filename,
      Body: data,
      ACL: 'public-read',
      CacheControl: `public, max-age=${duration.seconds()}`,
      Expires: moment().add(duration).toDate(),
      ContentType: contentTypes[extension] || 'application/octet-stream',
    };
    s3.upload(params, function(err, data) {
      if (err) throw err
      debug(`Uploaded ${filename} to ${bucket}`)
    });
  })
}

fs.readdir(projectConfig.paths.dist(), (err, files) => {
  files.forEach(file => {
    upload(file)
  });
})
