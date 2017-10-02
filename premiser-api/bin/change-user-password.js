const {ArgumentParser} = require('argparse')
const read = require('read')

const {logger} = require('howdju-ops')
const {AppProvider} = require('../src/init')

const appProvider = new AppProvider()
const {
  usersService,
  pool
} = appProvider

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
