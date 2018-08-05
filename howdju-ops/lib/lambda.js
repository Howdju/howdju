const AWS = require('aws-sdk')
const childProcess = require('child_process')
const fs = require('fs')
const isNumber = require('lodash/isNumber')
const toNumber = require('lodash/toNumber')
const toString = require('lodash/toString')

const {logger} = require('./logger')


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
  logger.info(`Updating ${functionName} from ${functionCodeZipPath}`)
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
  // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#publishVersion-property
  lambda.publishVersion(params, function(err, data) {
    if (err) throw err
    const version = data.Version
    logger.info(`Published lambda ${functionName} as version ${version}`)
  })
}

const updateAlias = (functionName, aliasName, newTarget) => {
  logger.info(`Updating '${aliasName}' to '${newTarget}'...`)
  if (/[0-9]+/.test(newTarget)) {
    updateAliasToVersion(functionName, aliasName, newTarget)
  } else {
    return getAliasVersion(functionName, newTarget, (err, newVersion) => {
      if (err) throw err
      logger.info(`Alias ${newTarget} is version ${newVersion}`)
      updateAliasToVersion(functionName, aliasName, newVersion)
    })
  }
}

const getAliasVersion = (functionName, aliasName, cb) => {
  const params = {
    FunctionName: functionName,
    Name: aliasName
  }
  lambda.getAlias(params, function(err, data) {
    if (err) return cb(err)
    cb(null, data['FunctionVersion'])
  })
}

const updateAliasToVersion = (functionName, aliasName, targetVersion) => {
  if (!isNumber(toNumber(targetVersion))) {
    throw new Error('targetVersion must be a number')
  }

  getAliasVersion(functionName, aliasName, (err, previousVersion) => {
    if (err) throw err
    const Name = aliasName
    // FunctionVersion must be a string representation of a number
    const FunctionVersion = toString(targetVersion)
    const params = {
      FunctionName: functionName,
      Name,
      FunctionVersion,
    }
    // https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#updateAlias-property
    lambda.updateAlias(params, function(err, data) {
      if (err) throw err
      logger.info(`Updated alias "${Name}" to FunctionVersion ${data['FunctionVersion']} (was ${previousVersion})`)
    })
  })

}

exports.lambda = {
  updateFunctionCode,
  publishVersion,
  updateAlias,
}
