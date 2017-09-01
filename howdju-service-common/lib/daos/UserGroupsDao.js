const map = require('lodash/map')
const Promise = require('bluebird')

exports.UserGroupsDao = class UserGroupsDao {

  constructor(database) {
    this.database = database
  }

  addUserToGroups(user, groupNames) {
    return this.database.query('select * from groups where name = ANY ($1)', [groupNames])
      .then( ({rows}) =>
        Promise.all(map(rows, groupRow =>
          this.database.query('insert into user_groups (user_id, group_id) values ($1, $2)', [user.id, groupRow.group_id])
        ))
      )
  }
}
