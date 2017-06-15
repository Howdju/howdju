const head = require('lodash/head')

class AuthDao {

  insertAuthToken(userId, authToken, created, expires) {
    return query(
        'insert into authentication_tokens (user_id, token, created, expires) values ($1, $2, $3, $4)',
        [userId, authToken, created, expires]
    )
        .then( ({rows: [row]}) => row )
  }

  deleteAuthToken(authToken) {
    return query('delete from authentication_tokens where token = $1 returning token', [authToken])
        .then( ({rows}) => head(rows))
  }
}

module.exports = new AuthDao()