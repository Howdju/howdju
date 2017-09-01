require('../lib/env')

const {ArgumentParser} = require('argparse')
const read = require('read')
const Promise = require('bluebird')

const logger = require('../lib/logger')
const {createUserAsUser} = require('../src/service')
const userPermissionsDao = require('../src/dao/userPermissionsDao')
const userGroupsDao = require('../src/dao/userGroupsDao')

const parser = new ArgumentParser({
  description: 'Add a user'
})
parser.addArgument('--email', {required: true})
parser.addArgument('--shortName')
parser.addArgument('--longName')
parser.addArgument('--phoneNumber')
parser.addArgument('--inactive', {action: 'storeTrue'})
parser.addArgument('--creatorUserId', {required: true})
parser.addArgument('--groups', {help: 'comma-delimited list'})
parser.addArgument('--permissions', {help: 'comma-delimited list'})
const args = parser.parseArgs()

read({ prompt: `Please enter the password for ${args.email}:`, silent: true }, createUserWithPassword)

function createUserWithPassword(error, password) {
  if (error) throw error

  const creatorUserId = args.creatorUserId
  const user = {
    email: args.email,
    password,
    shortName: args.shortName,
    longName: args.longName,
    phoneNumber: args.phoneNumber,
    isActive: !args.inactive,
  }
  return createUserAsUser(creatorUserId, user)
    .then( user => {
      logger.info(`Created user ${user.id} (${user.email})`)
      return user
    })
    .then( (user) => {
      return Promise.all([
        user,
        addPermissionsToUser(user, args.permissions)
      ])
    })
    .then( ([user]) => Promise.all([
      user,
      addUserToGroups(user, args.groups)
    ]))
}

const addPermissionsToUser = (user, permissions) => {
  if (permissions) {
    const permissionNames = permissions.split(',')
    return userPermissionsDao.addPermissionsToUser(user, permissionNames)
      .then(() => logger.info(`Granted user ${user.id} permissions: ${permissions}`))
  }
  return Promise.resolve()
}

const addUserToGroups = (user, groups) => {
  if (groups) {
    const groupNames = groups.split(',')
    return userGroupsDao.addUserToGroups(user, groupNames)
      .then(() => logger.info(`Added user ${user.id} to groups: ${groups}`))
  }
  return Promise.resolve()
}
