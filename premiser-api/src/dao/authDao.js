const head = require('lodash/head')
const {query} = require('../db')
const toString = require('lodash/toString')

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

  getUserId(authToken) {
    const sql = `
      select user_id
      from authentication_tokens
        where 
              token = $1 
          and expires > $2
          and deleted is null 
    `
    return query(sql, [authToken, new Date()]).then( ({rows}) => {
      if (rows.length < 1) {
        return null
      }
      const [{user_id: userId}] = rows

      return toString(userId)
    })
  }
}

module.exports = new AuthDao()