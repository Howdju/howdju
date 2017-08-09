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

read({ prompt: `Please enter the password for ${args.email}:`, silent: true }, createUserWithPassword)

const createUserWithPassword = (err, password) => Promise.resolve()
    .then(() => argon2.generateSalt())
    .then(salt => Promise.all([
        query('insert into users (email, created) values ($1, $2) returning user_id', [args.email, new Date()])
            .then( ({rows: [{user_id}]}) => user_id ),
        argon2.hash(password, salt),
    ]))
    .then( ([userId, hash]) => Promise.all([
        userId,
        query('insert into user_auth (user_id, hash) values ($1, $2)', [userId, hash]),
    ]))
    .then( userId => {
      console.log(`Created user ${userId} (${args.email})`)
      return userId
    })
    .then( userId => {
      if (args.permissions) {
        const permissions = args.permissions.split(',')
        return Promise.all([
            userId,
            query('select * from permissions where name = ANY ($1)', [permissions])
                .then( ({rows}) =>
                    map(rows, row =>
                        query('insert into user_permissions (permission_id, user_id) values ($1, $2)', [row.permission_id, userId])
                            .then(() => console.log(`Granted user ${userId} permission ${permission.name}`))
                    ))
        ])
      }
      return [userId]
    })
    .then( ([userId]) => {
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
