const os = require('os')
const path = require('path')

const {
  lambda,
  NodePlatforms,
} = require('howdju-ops')

if (os.platform() !== 'linux') {
  throw new Error("Must build on a Linux box because argon2 has native dependencies that are built during build")
}

const lambdarcPath = path.resolve('lambdarc')
const lambdarc = require(lambdarcPath)
const lambdaName = lambdarc.name

if (lambdarc.requiresNativeBuild && os.platform() !== NodePlatforms.LINUX) {
  throw new Error(`Lambda function ${lambdaName} includes native dependencies and so must use a Linux (current platform: ${os.platform()})`)
}

const zipPath = path.resolve(`dist/${lambdaName}.zip`)
lambda.updateFunctionCode(lambdaName, zipPath)
