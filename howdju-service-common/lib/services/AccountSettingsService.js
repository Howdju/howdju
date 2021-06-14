const {
  requireArgs,
} = require('howdju-common')
const {EntityService} = require('./EntityService')
const {
  accountSettingSchema
} = require('./validationSchemas')

exports.AccountSettingsService = class AccountSettingsService extends EntityService {
  constructor(logger, authService, accountSettingsDao) {
    requireArgs({logger, authService, accountSettingsDao})
    super(accountSettingSchema, logger, authService)
    this.logger = logger
    this.accountSettingsDao = accountSettingsDao
  }

  // Note, does not implement EntityService.doReadOrCreate. Maybe that isn't useful enough pattern to include on the
  // base class...

  async createAccountSettings(authToken, accountSettings) {
    const userId = await this.authService.readUserIdForAuthToken(authToken)
    const now = new Date()
    return await this.accountSettingsDao.createAccountSettingsForUserId(userId, accountSettings, now)
  }

  async readAccountSettings(authToken) {
    const userId = await this.authService.readUserIdForAuthToken(authToken)
    return await this.accountSettingsDao.readAccountSettingsForUserId(userId)
  }

  async doUpdate(accountSettings, userId, now) {
    return await this.accountSettingsDao.updateAccountSettingsForUserId(userId, accountSettings, now)
  }
}
