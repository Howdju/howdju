const get = require('lodash/get')

const {query} = require('../db')
const {
  toUser,
} = require('../orm')

class UsersDao {
  createUser(user, creatorUserId, now) {
    return query(
        'insert into users (email, creator_user_id, created) values ($1, $2, $3, $4) returning *',
        [user.email, hash, creatorUserId, now])
        .then( ({rows: [userRow]}) => toUser(userRow))
  }

  readUserForId(userId) {
    return query('select * from users join user_external_ids using (user_id) where user_id = $1', [userId])
        .then( ({rows: [row]}) => toUser(row) )
  }
}

module.exports = new UsersDao()