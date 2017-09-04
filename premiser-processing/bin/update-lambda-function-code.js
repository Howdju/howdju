const os = require('os')
const path = require('path')

const {ArgumentParser} = require('argparse')

const {
  lambda,
  NodePlatforms,
} = require('howdju-ops')


const parser = new ArgumentParser({
  description: "Update an AWS Lambda function's code"
})
parser.addArgument('--lambdaDir', {required: true})
const args = parser.parseArgs()
const lambdaDir = path.resolve('lambda-functions', args.lambdaDir)

const lambdarcPath = path.resolve(lambdaDir, 'lambdarc')
const lambdarc = require(lambdarcPath)
const lambdaName = lambdarc.name

if (lambdarc.requiresNativeBuild && os.platform() !== NodePlatforms.LINUX) {
  throw new Error(`Lambda function ${lambdaName} includes native dependencies and so must use a Linux (current platform: ${os.platform()})`)
}

const zipPath = path.resolve(`dist/lambda-functions/${lambdaName}/${lambdaName}.zip`)
lambda.updateFunctionCode(lambdarc.name, zipPath)
