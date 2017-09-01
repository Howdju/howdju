const map = require('lodash/map')
const Promise = require('bluebird')

exports.UserPermissionsDao = class UserPermissionsDao {

  constructor(database) {
    this.database = database
  }

  addPermissionsToUser(user, permissionNames) {
    return this.database.query('select * from permissions where name = ANY ($1)', [permissionNames])
      .then( ({rows}) =>
        Promise.all(map(rows, permissionRow =>
          this.database.query('insert into user_permissions (user_id, permission_id) values ($1, $2)', [user.id, permissionRow.permission_id])
        ))
      )
  }
}
