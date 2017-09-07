const {ArgumentParser} = require('argparse')
const read = require('read')

const {loadEnvironmentEnvVars} = require('howdju-ops')
loadEnvironmentEnvVars()

const {logger} = require('howdju-ops')

const {usersService} = require('../src/initialization')
const {pool} = require('../src/initialization/databaseInitialization')

const parser = new ArgumentParser({
  description: 'Change a user password'
})
parser.addArgument('--email', {required: true})
const args = parser.parseArgs()

read({ prompt: `Please enter the new password for ${args.email}:`, silent: true }, setUserPassword)

function setUserPassword(error, password) {
  if (error) throw error

  return usersService.updatePasswordForEmail(args.email, password)
    .catch(err => logger.error(err))
    .finally(() => pool.end())
}
