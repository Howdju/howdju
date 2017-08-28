const childProcess = require('child_process')
const fs = require('fs')

const isNumber = require('lodash/isNumber')
const toNumber = require('lodash/toNumber')

const AWS = require('aws-sdk')

AWS.config.region = 'us-east-1'
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'premiser'});
// See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'})
const FunctionName = 'premiserApi'

// e.g.: 15da8df Testing logging JSON
const getGitDescription = () => childProcess
    .execSync('git log --oneline -1')
    .toString()
    .trim()

module.exports.updateFunctionCode = (fileName) => {
  fs.readFile(fileName, (err, data) => {
    if (err) throw err

    const params = {
      FunctionName,
      Publish: false, // This boolean parameter can be used to request AWS Lambda to update the Lambda function and publish a version as an atomic operation.
      ZipFile: data
    }
    lambda.updateFunctionCode(params, (err, data) => {
      if (err) throw err
      console.log(`Uploaded ${FunctionName}`)
    })
  })
}

module.exports.publishVersion = () => {
  const params = {
    FunctionName,
    Description: getGitDescription(),
  };
  lambda.publishVersion(params, function(err, data) {
    if (err) throw err
    const version = data.Version
    console.log(`Published lambda ${FunctionName} as version ${version}`)
  });
}

module.exports.updateAlias = (aliasName, newTarget) => {
  if (!isNumber(toNumber(newTarget))) {
    // TODO allow passing a target alias
    throw new Error('newTarget must be a number')
  }

  const Name = aliasName
  const FunctionVersion = newTarget
  const params = {
    FunctionName,
    Name,
    FunctionVersion,
  };
  lambda.updateAlias(params, function(err, data) {
    if (err) throw err
    console.log(`Updated alias "${Name}" to version ${FunctionVersion}`)
  });
}
