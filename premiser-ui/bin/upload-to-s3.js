const AWS = require('aws-sdk')
const debug = require('debug')('premiser-ui:upload-to-s3')
const fs = require('fs')
const moment = require('moment');
const path = require('path')
const uuid = require('uuid');


const projectConfig = require('../config/project.config')

AWS.config.region = projectConfig.aws.region
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: projectConfig.aws.profile});
const s3 = new AWS.S3({apiVersion: '2006-03-01'});

const contentTypes = {
  '.js': 'application/javascript',
  '.html': 'text/html',
  '.map': 'application/octet-stream',
}

const bucket = projectConfig.aws.bucket
const upload = (filename) => {
  fs.readFile(projectConfig.paths.dist(filename), (err, data) => {
    if (err) throw err

    const extension = path.extname(filename)
    const duration = moment.duration(projectConfig.aws.cacheDuration)
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
      debug(`Uploaded ${filename} to ${bucket} (ETag: ${data.ETag})`)
    });
  })
}


fs.readdir(projectConfig.paths.dist(), (err, files) => {
  files.forEach(file => {
    upload(file)
  });
})