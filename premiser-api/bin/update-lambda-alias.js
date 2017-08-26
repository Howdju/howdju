const {ArgumentParser} = require('argparse')

const {updateAlias} = require('../lib/lambda')

const parser = new ArgumentParser({
  description: 'Update an AWS Lambda function alias'
})
parser.addArgument('aliasName')
parser.addArgument('newTarget')
const args = parser.parseArgs()

updateAlias(args.aliasName, args.newTarget)
