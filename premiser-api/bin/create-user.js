// Must occur before loading db methods
const env = require('node-env-file')
const path = require('path')
const envFilename = process.env.NODE_ENV === 'production' ? '../config/production.env' : '../src/.env'
env(path.join(__dirname, envFilename))

const argon2 = require('argon2')
const {ArgumentParser} = require('argparse')
const read = require('read')
const Promise = require('bluebird')
const map = require('lodash/map')

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
  console.log(args)
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
      console.log(`Created user ${user.id} (${user.email})`)
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
        .then(() => console.log(`Granted user ${user.id} permissions: ${permissions}`))
  }
  return Promise.resolve()
}

const addUserToGroups = (user, groups) => {
  if (groups) {
    const groupNames = groups.split(',')
    return userGroupsDao.addUserToGroups(user, groupNames)
        .then(() => console.log(`Added user ${user.id} to groups: ${groups}`))
  }
  return Promise.resolve()
}
