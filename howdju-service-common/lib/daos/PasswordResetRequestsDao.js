const {BaseDao} = require('./BaseDao')

const {toPasswordResetRequest} = require('./orm')

module.exports.PasswordResetRequestsDao = class PasswordResetRequestsDao extends BaseDao {
  
  constructor(logger, database) {
    super(logger, database, toPasswordResetRequest)
  }
  
  async create(passwordResetRequest, userId, passwordResetCode, expires, isConsumed, now) {
    const {
      email,
    } = passwordResetRequest
    return await this.queryOne(
      'PasswordResetRequestsDao.create',
      `
        insert into password_reset_requests (user_id, email, password_reset_code, expires, is_consumed, created)
        values ($1, $2, $3, $4, $5, $6)
        returning *
      `,
      [userId, email, passwordResetCode, expires, isConsumed, now]
    )
  }
  
  async readForCode(passwordResetCode) {
    return await this.queryOne(
      'PasswordResetRequestsDao.readForCode',
      `select * from password_reset_requests where password_reset_code = $1 and deleted is null`,
      [passwordResetCode]
    )
  }
  
  async consumeForCode(passwordResetCode) {
    return await this.execute(
      'PasswordResetRequestsDao.consumeForCode',
      'update password_reset_requests set is_consumed = true where password_reset_code = $1 and deleted is null',
      [passwordResetCode]
    )
  }
}