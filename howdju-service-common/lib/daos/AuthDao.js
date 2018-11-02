const get = require('lodash/get')
const toString = require('lodash/toString')

const {toUserHash} = require('./orm')
const {mapSingle} = require('./daosUtil')

exports.AuthDao = class AuthDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  createUserAuthForUserId(userId, hash, hashType) {
    return this.database.query(
      'createUserAuthForUserId',
      'insert into user_auth (user_id, hash, hash_type) values ($1, $2, $3) returning *',
      [userId, hash, hashType]
    )
      .then( ({rows: [row]}) => toUserHash(row))
  }

  readUserHashForId(userId, hashType) {
    return this.database.query(
      'readUserHashForId',
      `
      select 
          ua.user_id
        , ua.hash 
      from users u join user_auth ua using (user_id) 
        where
              u.deleted is null
          and ua.user_id = $1
          and ua.hash_type = $2`,
      [userId, hashType]
    )
      .then( ({rows: [row]}) => toUserHash(row))
  }

  readUserHashForEmail(email, hashType) {
    return this.database.query(
      'readUserHashForEmail',
      `
        select 
            ua.user_id
          , ua.hash 
        from users u join user_auth ua using (user_id) 
          where
                u.deleted is null
            and u.email = $1
            and ua.hash_type = $2
      `,
      [email, hashType]
    )
      .then( ({rows: [row]}) => toUserHash(row))
  }

  updateUserAuthForUserId(userId, hash, hashType) {
    return this.database.query(
      'updateUserAuthForUserId',
      'update user_auth set hash = $2 where user_id = $1 and hash_type = $3 returning *',
      [userId, hash, hashType]
    )
      .then(mapSingle(this.logger, toUserHash, 'user_auth', {userId}))
  }

  insertAuthToken(userId, authToken, created, expires) {
    return this.database.query(
      'insertAuthToken',
      'insert into user_auth_tokens (user_id, auth_token, created, expires) values ($1, $2, $3, $4) returning auth_token',
      [userId, authToken, created, expires]
    )
      .then( ({rows: [row]}) => get(row, 'auth_token') )
  }

  deleteAuthToken(authToken) {
    return this.database.query(
      'deleteAuthToken',
      'delete from user_auth_tokens where auth_token = $1 returning user_id',
      [authToken]
    )
      .then( ({rows: [row]}) => get(row, 'user_id'))
  }

  getUserIdForAuthToken(authToken) {
    const sql = `
      select u.user_id
      from user_auth_tokens uat
          join users u using (user_id)
        where 
              uat.auth_token = $1 
          and uat.expires > $2
          and uat.deleted is null
          and u.deleted is null
          and u.is_active 
    `
    return this.database.query('getUserIdForAuthToken', sql, [authToken, new Date()]).then( ({rows}) => {
      if (rows.length < 1) {
        return null
      }
      const [{user_id: userId}] = rows

      return toString(userId)
    })
  }
}