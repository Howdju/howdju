const { toRegistrationRequest } = require("./orm");
const { BaseDao } = require("./BaseDao");

exports.RegistrationRequestsDao = class RegistrationRequestsDao extends (
  BaseDao
) {
  constructor(logger, database) {
    super(logger, database, toRegistrationRequest);
  }

  async create(registrationRequest, registrationCode, now) {
    const { email, expires } = registrationRequest;
    return await this.queryOne(
      "RegistrationRequestsDao.create",
      `
        insert into registration_requests (email, registration_code, expires, is_consumed, created)
        values ($1, $2, $3, $4, $5)
        returning *
      `,
      [email, registrationCode, expires, false, now]
    );
  }

  async readForCode(registrationCode) {
    return await this.queryOne(
      "RegistrationRequestsDao.readForCode",
      `select * from registration_requests where registration_code = $1 and deleted is null`,
      [registrationCode]
    );
  }

  async consumeForCode(registrationCode) {
    return await this.execute(
      "RegistrationRequestsDao.consumeForCode",
      "update registration_requests set is_consumed = true where registration_code = $1 and deleted is null",
      [registrationCode]
    );
  }
};
