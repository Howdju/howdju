const {
  requireArgs,
  makeNewAccountSettings,
  CreateAccountSettings,
  EditAccountSettings,
} = require("howdju-common");
const { EntityService } = require("./EntityService");

exports.AccountSettingsService = class AccountSettingsService extends (
  EntityService
) {
  constructor(logger, authService, accountSettingsDao) {
    requireArgs({ logger, authService, accountSettingsDao });
    super(
      { createSchema: CreateAccountSettings, editSchema: EditAccountSettings },
      logger,
      authService
    );
    this.logger = logger;
    this.accountSettingsDao = accountSettingsDao;
  }

  // Note, does not implement EntityService.doReadOrCreate. Maybe that isn't useful enough pattern to include on the
  // base class...

  async createAccountSettings(authToken, accountSettings) {
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const now = new Date();
    return this.accountSettingsDao.createAccountSettingsForUserId(
      userId,
      accountSettings,
      now
    );
  }

  async readOrCreateAccountSettings(authToken) {
    const userId = await this.authService.readUserIdForAuthToken(authToken);
    const accountSettings =
      await this.accountSettingsDao.readAccountSettingsForUserId(userId);
    if (accountSettings) {
      return accountSettings;
    }
    return this.createAccountSettings(authToken, makeNewAccountSettings());
  }

  async doUpdate(accountSettings, userId, now) {
    return await this.accountSettingsDao.updateAccountSettingsForUserId(
      userId,
      accountSettings,
      now
    );
  }
};
