const AWS = require('aws-sdk')
const childProcess = require('child_process')
const fs = require('fs')
const isNumber = require('lodash/isNumber')
const toNumber = require('lodash/toNumber')

const logger = require('./logger')


AWS.config.region = 'us-east-1'
AWS.config.credentials = new AWS.SharedIniFileCredentials({profile: 'premiser'})
// See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'})

// e.g.: 15da8df Testing logging JSON
const getGitDescription = () => childProcess
  .execSync('git log --oneline -1')
  .toString()
  .trim()

const updateFunctionCode = (functionName, functionCodeZipPath) => {
  fs.readFile(functionCodeZipPath, (err, data) => {
    if (err) throw err

    const params = {
      FunctionName: functionName,
      Publish: false, // This boolean parameter can be used to request AWS Lambda to update the Lambda function and publish a version as an atomic operation.
      ZipFile: data
    }
    lambda.updateFunctionCode(params, (err, data) => {
      if (err) throw err
      logger.info(`Uploaded ${functionName} (CodeSha256: ${data['CodeSha256']})`)
    })
  })
}

const publishVersion = (functionName) => {
  const params = {
    FunctionName: functionName,
    Description: getGitDescription(),
  }
  lambda.publishVersion(params, function(err, data) {
    if (err) throw err
    const version = data.Version
    logger.info(`Published lambda ${functionName} as version ${version}`)
  })
}

const updateAlias = (functionName, aliasName, newTarget) => {
  if (!isNumber(toNumber(newTarget))) {
    // TODO allow passing a target alias
    throw new Error('newTarget must be a number')
  }

  const Name = aliasName
  const FunctionVersion = newTarget
  const params = {
    FunctionName: functionName,
    Name,
    FunctionVersion,
  }
  lambda.updateAlias(params, function(err, data) {
    if (err) throw err
    logger.info(`Updated alias "${Name}" to FunctionVersion ${data['FunctionVersion']}`)
  })
}

exports.lambda = {
  updateFunctionCode,
  publishVersion,
  updateAlias,
}
