const childProcess = require('child_process')
const fs = require('fs')

const AWS = require('aws-sdk')

AWS.config.region = 'us-east-1'
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'premiser'});
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'})
const FunctionName = 'premiserApi'

// e.g.: 15da8df Testing logging JSON
const getGitDescription = () => childProcess
    .execSync('git log --oneline -1')
    .toString()
    .trim()

module.exports.updateFunctionCode = (fileName, log) => {
  fs.readFile(fileName, (err, data) => {
    if (err) throw err

    const params = {
      FunctionName,
      Description: getGitDescription(),
      Publish: false, // This boolean parameter can be used to request AWS Lambda to update the Lambda function and publish a version as an atomic operation.
      ZipFile: data
    }
    lambda.updateFunctionCode(params, (err, data) => {
      if (err) throw err
      log(`Uploaded ${FunctionName}`)
    })
  })
}

module.exports.publishLambda = (log) => {
  const params = {
    FunctionName,
  };
  lambda.publishVersion(params, function(err, data) {
    if (err) throw err
    const version = data[Version]
    log(`Published lambda ${FunctionName} as version ${version}`)
  });
}

module.exports.updateAlias = (log) => {
  const Name = process.argv[2]
  const FunctionVersion = process.argv[3]
  const params = {
    FunctionName,
    Name,
    FunctionVersion,
  };
  lambda.updateAlias(params, function(err, data) {
    if (err) throw err
    log(`Updated alias "${Name} to version ${FunctionVersion}`)
  });
}
