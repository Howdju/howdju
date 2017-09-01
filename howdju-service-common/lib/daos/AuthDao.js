const get = require('lodash/get')
const toString = require('lodash/toString')

const {toUserHash} = require('./orm')

exports.AuthDao = class AuthDao {

  constructor(database) {
    this.database = database
  }

  readUserHashForEmail(email) {
    return this.database.query(`
      select ua.user_id, ua.hash 
      from users u join user_auth ua using (user_id) 
        where
              u.deleted is null
          and u.email = $1`, [email])
      .then( ({rows: [row]}) => toUserHash(row))
  }

  createUserAuthForUserId(userId, hash) {
    return this.database.query('insert into user_auth (user_id, hash) values ($1, $2) returning *', [userId, hash])
      .then( ({rows: [row]}) => toUserHash(row))
  }

  insertAuthToken(userId, authToken, created, expires) {
    return this.database.query(
      'insert into user_auth_tokens (user_id, auth_token, created, expires) values ($1, $2, $3, $4) returning auth_token',
      [userId, authToken, created, expires]
    )
      .then( ({rows: [row]}) => get(row, 'auth_token') )
  }

  deleteAuthToken(authToken) {
    return this.database.query('delete from user_auth_tokens where auth_token = $1 returning user_id', [authToken])
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
    return this.database.query(sql, [authToken, new Date()]).then( ({rows}) => {
      if (rows.length < 1) {
        return null
      }
      const [{user_id: userId}] = rows

      return toString(userId)
    })
  }
}