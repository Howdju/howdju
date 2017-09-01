const {
  toUser,
} = require('./orm')


exports.UsersDao = class UsersDao {

  constructor(database) {
    this.database = database
  }

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
    return this.database.query(`insert into users (email, short_name, long_name, phone_number, creator_user_id, is_active, created) 
      values ($1, $2, $3, $4, $5, $6, $7) returning *`, args)
      .then( ({rows: [userRow]}) => toUser(userRow))
  }

  readUserForId(userId) {
    return this.database.query('select * from users join user_external_ids using (user_id) where user_id = $1', [userId])
      .then( ({rows: [row]}) => toUser(row) )
  }

  updateLastLoginForUserId(userId, now) {
    return this.database.query('update users set last_login = $1 where user_id = $2', [now, userId])
  }
}
