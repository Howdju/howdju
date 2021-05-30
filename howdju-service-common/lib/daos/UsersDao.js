const {
  toUser,
} = require('./orm')
const {
  mapSingle
} = require('./daosUtil')
const {BaseDao} = require('./BaseDao')


exports.UsersDao = class UsersDao extends BaseDao {

  constructor(logger, database) {
    super(logger, database, toUser)
    this.logger = logger
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
      user.acceptedTerms,
      now,
    ]
    return this.database.query(
      'createUser',
      `
        insert into users (email, short_name, long_name, phone_number, creator_user_id, is_active, accepted_terms, created)
        values ($1, $2, $3, $4, $5, $6, $7, $8) returning *
      `,
      args
    )
      .then( ({rows: [userRow]}) => toUser(userRow))
  }

  async isEmailInUse(email) {
    return this.queryOneValue(
      'isEmailInUse',
      'select exists(select 1 from users where email = $1 and deleted is null)',
      [email]
    )
  }

  async isUsernameInUse(username) {
    return this.queryOneValue(
      'isUsernameInUse',
      'select exists(select 1 from users where username = $1 and deleted is null)',
      [username]
    )
  }

  readUserForId(userId) {
    return this.database.query(
      'readUserForId',
      'select * from users join user_external_ids using (user_id) where user_id = $1 and deleted is null',
      [userId]
    )
      .then( ({rows: [row]}) => toUser(row) )
  }

  readUserForEmail(email) {
    return this.database.query(
      'readUserForEmail',
      'select * from users join user_external_ids using (user_id) where email = $1 and deleted is null',
      [email]
    )
      .then(mapSingle(this.logger, toUser, 'users', {email}))
  }

  readUserForUsername(username) {
    return this.database.query(
      'readUserForUsername',
      'select * from users join user_external_ids using (user_id) where username = $1 and deleted is null',
      [username]
    )
      .then(mapSingle(this.logger, toUser, 'users', {username}))
  }

  updateLastLoginForUserId(userId, now) {
    return this.database.query(
      'updateLastLoginForUserId',
      'update users set last_login = $1 where user_id = $2',
      [now, userId]
    )
  }
}
