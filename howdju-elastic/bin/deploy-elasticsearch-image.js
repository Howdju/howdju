const fs = require('fs')
const path = require('path')

const {ArgumentParser} = require('argparse')
const ini = require('ini')
const Promise = require('bluebird')

const exec = Promise.promisify(require('child_process').exec)

const parser = new ArgumentParser({
  description: 'Builds the Elasticsearch Docker image'
})
parser.add_argument('version')
const args = parser.parse_args()

const component = 'elasticsearch'

const credentialsPath = path.join(process.env.HOME, '.aws/credentials')
const credentials = ini.parse(fs.readFileSync(credentialsPath, 'utf-8'))

const s3ReposityKeyId = credentials.premiser.elasticsearch_s3_snapshots_user.aws_access_key_id
const s3RepositorySecretKey = credentials.premiser.elasticsearch_s3_snapshots_user.aws_secret_access_key

const command = `bin/deploy_component_image.sh ${component} ${args.version}`
  + ` S3_REPOSITORY_KEY_ID=${s3ReposityKeyId}`
  + ` S3_REPOSITORY_SECRET_KEY=${s3RepositorySecretKey}`
  + ` 2>&1`
exec(command, (err, stdout, stderr) => {
  console.log(stdout)
})
