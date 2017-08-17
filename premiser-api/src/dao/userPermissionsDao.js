const map = require('lodash/map')
const {query} = require('../db')
const Promise = require('bluebird')

class UserPermissionsDao {
  addPermissionsToUser(user, permissionNames) {
    return query('select * from permissions where name = ANY ($1)', [permissionNames])
        .then( ({rows}) =>
            Promise.all(map(rows, permissionRow =>
                query('insert into user_permissions (user_id, permission_id) values ($1, $2)', [user.id, permissionRow.permission_id])
            ))
        )
  }
}

module.exports = new UserPermissionsDao()