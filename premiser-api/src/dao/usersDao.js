const {
  toUser,
} = require('../orm')

class UsersDao {
  createUser(user, hash, creatorUserId, now) {
    return query(
        'insert into users (email, hash, creator_user_id, created) values ($1, $2, $3, $4) returning *',
        [user.email, hash, creatorUserId, now])
        .then( ({rows: [userRow]}) => toUser(userRow))
  }

  readAuthUserByEmail(email) {
    return query('select user_id, email, hash from users where email = $1', [email])
        .then( ({rows: [userRow]}) => toUser(userRow) )
  }
}

module.exports = new UsersDao()