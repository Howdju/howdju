const {
  toRegistration
} = require('./orm')
const {
  BaseDao
} = require('./BaseDao')

exports.RegistrationsDao = class RegistrationsDao extends BaseDao {
  constructor(logger, database) {
    super(logger, database, toRegistration)
  }
  
  async isEmailInUse(email) {
    return this.queryOneValue(
      'isEmailInUse',
      'select exists(select 1 from registrations where email = $1 and deleted is null)',
      [email]
    )
  }

  async createRegistration(registration, registrationConfirmationCode, expires, isConsumed, now) {
    return await this.queryOne(
      'createRegistration',
      `
        insert into registrations (email, registration_confirmation_code, expires, is_consumed, created)
        values ($1, $2, $3, $4, $5)
        returning *
      `,
      [registration.email, registrationConfirmationCode, expires, isConsumed, now]
    )
  }
  
  async readRegistrationForCompletionCode(registrationConfirmationCode) {
    return await this.queryOne(
      'readRegistrationForCompletionCode', 
      `select * from registrations where registration_confirmation_code = $1 and deleted is null`, 
      [registrationConfirmationCode]
    )
  }
  
  async consumeRegistrationForCompletionCode(registrationConfirmationCode) {
    return await this.execute('consumeRegistrationForCompletionCode',
      'update registrations set is_consumed = true where registration_confirmation_code = $1 and deleted is null',
      [registrationConfirmationCode]
    )
  }
}
