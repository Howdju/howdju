const get = require('lodash/get')
const head = require('lodash/head')
const {query} = require('../db')
const toString = require('lodash/toString')
const {toUserHash} = require('../orm')

class AuthDao {

  readUserHashForEmail(email) {
    return query(`
      select ua.user_id, ua.hash 
      from users u join user_auth ua using (user_id) 
        where
              u.deleted is null
          and u.email = $1`, [email])
        .then( ({rows: [row]}) => toUserHash(row))
  }

  createUserAuthForUserId(userId, hash) {
    return query('insert into user_auth (user_id, hash) values ($1, $2) returning *', [userId, hash])
        .then( ({rows: [row]}) => toUserHash(row))
  }

  insertAuthToken(userId, authToken, created, expires) {
    return query(
        'insert into user_auth_tokens (user_id, auth_token, created, expires) values ($1, $2, $3, $4) returning auth_token',
        [userId, authToken, created, expires]
    )
        .then( ({rows: [row]}) => get(row, 'auth_token') )
  }

  deleteAuthToken(authToken) {
    return query('delete from user_auth_tokens where auth_token = $1 returning user_id', [authToken])
        .then( ({rows: [row]}) => get(row, 'user_id'))
  }

  getUserIdForAuthToken(authToken) {
    const sql = `
      select user_id
      from user_auth_tokens
        where 
              auth_token = $1 
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