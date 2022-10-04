const {ArgumentParser} = require('argparse')
const read = require('read')
const Promise = require('bluebird')

const {logger} = require('howdju-ops')

const {AppProvider} = require('../src/init')

const appProvider = new AppProvider()

const {
  usersService,
  permissionsService,
  groupsService,
  pool,
} = appProvider

const parser = new ArgumentParser({
  description: 'Add a user'
})
parser.add_argument('--email', {required: true})
parser.add_argument('--shortName')
parser.add_argument('--longName')
parser.add_argument('--phoneNumber')
parser.add_argument('--inactive', {action: 'storeTrue'})
parser.add_argument('--creatorUserId', {required: true})
parser.add_argument('--groups', {help: 'comma-delimited list'})
parser.add_argument('--permissions', {help: 'comma-delimited list'})
const args = parser.parse_args()

Promise.promisify(read)({ prompt: `Please enter the password for ${args.email}:`, silent: true })
  .then(password => {
    const creatorUserId = args.creatorUserId
    const user = {
      email: args.email,
      shortName: args.shortName,
      longName: args.longName,
      phoneNumber: args.phoneNumber,
      isActive: !args.inactive,
    }
    return usersService.createUserAsUser(creatorUserId, user, password)
  })
  .then( user => {
    logger.info('Created user', {id: user.id, email: user.email})
    return user
  })
  .then(user => Promise.all([
    addPermissionsToUser(user, args.permissions),
    addUserToGroups(user, args.groups)
  ]))
  .finally(() => pool.end())
  .catch(err => console.log({err}))

const addPermissionsToUser = (user, permissions) => {
  if (permissions) {
    const permissionNames = permissions.split(',')
    return permissionsService.addPermissionsToUser(user, permissionNames)
      .then(() => logger.info(`Granted user ${user.id} permissions: ${permissions}`))
  }
  return Promise.resolve()
}

const addUserToGroups = (user, groups) => {
  if (groups) {
    const groupNames = groups.split(',')
    return groupsService.addUserToGroups(user, groupNames)
      .then(() => logger.info(`Added user ${user.id} to groups: ${groups}`))
  }
  return Promise.resolve()
}
