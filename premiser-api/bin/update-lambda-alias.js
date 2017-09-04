const {ArgumentParser} = require('argparse')

const {lambda} = require('howdju-ops')

const lambdarc = require('../lambdarc')

const parser = new ArgumentParser({
  description: 'Update an AWS Lambda function alias'
})
parser.addArgument('aliasName')
parser.addArgument('newTarget')
const args = parser.parseArgs()

lambda.updateAlias(lambdarc.name, args.aliasName, args.newTarget)
