const {ArgumentParser} = require('argparse')

const {lambda} = require('howdju-ops')

const lambdarc = require('../lambdarc')

const parser = new ArgumentParser({
  description: 'Update an AWS Lambda function alias'
})
parser.add_argument('--aliasName')
parser.add_argument('--newTarget')
const args = parser.parse_args()

lambda.updateAlias(lambdarc.name, args.aliasName, args.newTarget)
