const map = require('lodash/map')
const {query} = require('../db')
const Promise = require('bluebird')

class UserGroupsDao {
  addUserToGroups(user, groupNames) {
    return query('select * from groups where name = ANY ($1)', [groupNames])
        .then( ({rows}) =>
            Promise.all(map(rows, groupRow =>
                query('insert into user_groups (user_id, group_id) values ($1, $2)', [user.id, groupRow.group_id])
            ))
        )
  }
}

module.exports = new UserGroupsDao()