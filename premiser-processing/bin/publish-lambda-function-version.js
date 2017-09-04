const {ArgumentParser} = require('argparse')
const path = require('path')

const {lambda} = require('howdju-ops')


const argParser = new ArgumentParser({
  description: 'Publish a lambda function version'
})
argParser.addArgument('--lambdaDir', {required: true})
const args = argParser.parseArgs()

const lambdarcPath = path.resolve('lambda-functions', args.lambdaDir, 'lambdarc')
const lambdarc = require(lambdarcPath)

lambda.publishVersion(lambdarc.name)
