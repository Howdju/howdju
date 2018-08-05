const os = require('os')
const path = require('path')

const {
  lambda,
  NodePlatforms,
} = require('howdju-ops')

const lambdarcPath = path.resolve('lambdarc')
const lambdarc = require(lambdarcPath)
const lambdaName = lambdarc.name

if (lambdarc.requiresNativeBuild && os.platform() !== NodePlatforms.LINUX) {
  throw new Error(`Lambda function ${lambdaName} includes native dependencies and so must use a Linux (current platform: ${os.platform()})`)
}

const zipPath = path.resolve(`dist/${lambdaName}.zip`)
lambda.updateFunctionCode(lambdaName, zipPath)
