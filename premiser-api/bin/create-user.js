const argon2 = require('argon2')
const {ArgumentParser} = require('argparse')
const read = require('read')
const env = require('node-env-file')
const path = require('path')
const Promise = require('bluebird')
const map = require('lodash/map')

const envFilename = process.env.NODE_ENV === 'production' ? '../config/production.env' : '../src/.env'
env(path.join(__dirname, envFilename))

const {query} = require('../src/db')

const parser = new ArgumentParser({
  description: 'Add a user'
})
parser.addArgument('--email', {required: true})
parser.addArgument('--groups', {help: 'comma-delimited list'})
parser.addArgument('--permissions', {help: 'comma-delimited list'})
const args = parser.parseArgs()

read({ prompt: `Please enter the password for ${args.email}:`, silent: true }, function(err, password) {
  argon2.generateSalt().then(salt => {
    Promise.resolve(argon2.hash(password, salt))
        .then( hash => query('insert into users (email, hash, created) values ($1, $2, $3) returning user_id', [args.email, hash, new Date()]))
        .then( ({rows: [{user_id: userId}]}) => {
          console.log(`Created user ${userId} (${args.email})`)
          return Promise.all([
            Promise.resolve().then(() => {
              if (args.permissions) {
                const permissions = args.permissions.split(',')
                return query('select * from permissions where name = ANY ($1)', [permissions])
                    .then( ({rows: permissions}) =>
                        map(permissions, permission =>
                            query('insert into user_permissions (permission_id, user_id) values ($1, $2)', [permission.permission_id, userId])
                                .then(() => console.log(`Granted user ${userId} permission ${permission.name}`))
                        ))
              }
            }),
            Promise.resolve().then(() => {
              if (args.groups) {
                const groups = args.groups.split(',')
                return query('select * from groups where name = ANY ($1)', [groups])
                    .then( ({rows: groups}) =>
                        map(groups, group =>
                            query('insert into user_groups (user_id, group_id) values ($1, $2)', [userId, group.group_id])
                                .then(() => console.log(`Added user ${userId} to group ${group.name}`))
                        ))
              }
            })
          ])
        })
        .error(error => { throw error })
  })
})
