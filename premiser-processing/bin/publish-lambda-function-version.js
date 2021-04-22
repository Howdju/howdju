const {ArgumentParser} = require('argparse')
const path = require('path')

const {lambda} = require('howdju-ops')


const argParser = new ArgumentParser({
  description: 'Publish a lambda function version'
})
argParser.add_argument('--lambdaDir', {required: true})
argParser.add_argument('--versionDescription')
const args = argParser.parse_args()

const lambdarcPath = path.resolve('lambda-functions', args.lambdaDir, 'lambdarc')
const lambdarc = require(lambdarcPath)

lambda.publishVersion(lambdarc.name, args.versionDescription)
