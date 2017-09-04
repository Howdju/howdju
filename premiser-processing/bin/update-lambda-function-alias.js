const {ArgumentParser} = require('argparse')
const path = require('path')

const {lambda} = require('howdju-ops')


const parser = new ArgumentParser({
  description: 'Update an AWS Lambda function alias'
})
parser.addArgument('--lambdaDir', {required: true})
parser.addArgument('--aliasName', {required: true})
parser.addArgument('--newTarget', {required: true})
const args = parser.parseArgs()

const lambdarcPath = path.join(args.lambdaDir, 'lambdarc')
const lambdarc = require(lambdarcPath)

lambda.updateAlias(lambdarc.name, args.aliasName, args.newTarget)
