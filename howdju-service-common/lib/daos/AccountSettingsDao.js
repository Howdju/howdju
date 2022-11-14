const { requireArgs } = require("howdju-common");

const { toAccountSettings } = require("./orm");
const { BaseDao } = require("./BaseDao");

exports.AccountSettingsDao = class AccountSettingsDao extends BaseDao {
  constructor(logger, database) {
    requireArgs({ logger, database });
    super(logger, database, toAccountSettings);
  }

  async createAccountSettingsForUserId(userId, accountSettings, now) {
    return await this.queryOne(
      "createAccountSettings",
      `
        insert into 
          account_settings(user_id, paid_contributions_disclosure, created, modified)
          values ($1, $2, $3, $4)
          returning *;
      `,
      [userId, accountSettings.paidContributionsDisclosure, now, now]
    );
  }

  async readAccountSettingsForUserId(userId) {
    return await this.queryOne(
      "readAccountSettings",
      `
        select * 
        from account_settings 
        where user_id = $1
      `,
      [userId]
    );
  }

  async updateAccountSettingsForUserId(userId, accountSettings, now) {
    return this.queryOne(
      "updateAccountSettings",
      `
        update account_settings 
        set paid_contributions_disclosure = $2, modified = $3
        where user_id = $1
        returning *
      `,
      [userId, accountSettings.paidContributionsDisclosure, now]
    );
  }
};
