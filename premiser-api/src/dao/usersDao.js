const get = require('lodash/get')

const {
  toUser,
} = require('howdju-service-common')

const {query} = require('../db')

class UsersDao {
  createUser(user, creatorUserId, now) {
    const args = [
      user.email,
      user.shortName,
      user.longName,
      user.phoneNumber,
      creatorUserId,
      user.isActive,
      now,
    ]
    return query(`insert into users (email, short_name, long_name, phone_number, creator_user_id, is_active, created) 
      values ($1, $2, $3, $4, $5, $6, $7) returning *`, args)
        .then( ({rows: [userRow]}) => toUser(userRow))
  }

  readUserForId(userId) {
    return query('select * from users join user_external_ids using (user_id) where user_id = $1', [userId])
        .then( ({rows: [row]}) => toUser(row) )
  }

  updateLastLoginForUserId(userId, now) {
    return query('update users set last_login = $1 where user_id = $2', [now, userId])
  }
}

module.exports = new UsersDao()