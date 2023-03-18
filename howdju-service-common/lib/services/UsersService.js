const Promise = require("bluebird");

const {
  ActionTypes,
  ActionTargetTypes,
  EntityTypes,
  makeAccountSettings,
  requireArgs,
  schemaIds,
  utcNow,
  validate,
} = require("howdju-common");

const { permissions } = require("../permissions");
const {
  EntityValidationError,
  EntityNotFoundError,
} = require("../serviceErrors");

exports.UsersService = class UsersService {
  constructor(
    userValidator,
    actionsService,
    authService,
    permissionsService,
    userExternalIdsDao,
    usersDao,
    accountSettingsDao
  ) {
    requireArgs({
      userValidator,
      actionsService,
      authService,
      permissionsService,
      userExternalIdsDao,
      usersDao,
      accountSettingsDao,
    });
    this.userValidator = userValidator;
    this.actionsService = actionsService;
    this.authService = authService;
    this.permissionsService = permissionsService;
    this.userExternalIdsDao = userExternalIdsDao;
    this.usersDao = usersDao;
    this.accountSettingsDao = accountSettingsDao;
  }

  async isEmailInUse(email) {
    return await this.usersDao.isEmailInUse(email);
  }

  async isUsernameInUse(username) {
    return await this.usersDao.isUsernameInUse(username);
  }

  createUserAsAuthToken(authToken, user) {
    return this.permissionsService
      .readUserIdHavingPermissionForAuthToken(
        authToken,
        permissions.CREATE_USERS
      )
      .then((creatorUserId) => this.createUserAsUser(creatorUserId, user));
  }

  async readUserForId(userId) {
    return await this.usersDao.readUserForId(userId);
  }

  async readUserForEmail(email) {
    return await this.usersDao.readUserForEmail(email);
  }

  updatePasswordForEmail(email, password) {
    return this.usersDao
      .readUserForEmail(email)
      .then((user) => {
        if (!user) {
          throw new EntityNotFoundError(EntityTypes.USER, email);
        }

        return Promise.all([
          user,
          this.authService.createOrUpdatePasswordAuthForUserId(
            user.id,
            password
          ),
        ]);
      })
      .then(([user]) => user);
  }

  async createRegisteredUser(user, passwordHash, passwordHashType, now) {
    const { isValid, errors } = validate(schemaIds.user, user);
    if (!isValid) {
      throw new EntityValidationError(errors);
    }

    const createdUser = await this.usersDao.createUser(user, null, now);
    await this.authService.createPasswordHashAuthForUserId(
      createdUser.id,
      passwordHash,
      passwordHashType
    );
    await this.userExternalIdsDao.createExternalIdsForUserId(createdUser.id);
    this.actionsService.asyncRecordAction(
      createdUser.id,
      createdUser.created,
      ActionTypes.CREATE,
      ActionTargetTypes.USER,
      createdUser.id
    );
    return this.usersDao.readUserForId(createdUser.id);
  }

  async createUserAsUser(creatorUserId, user, password) {
    await Promise.resolve();
    requireArgs({ user, password });
    const validationErrors = this.userValidator.validate(user);
    if (validationErrors.hasErrors) {
      throw new EntityValidationError({ user: validationErrors });
    }
    validationErrors;
    const now = utcNow();
    const createUserDataIn = {
      ...user,
      acceptedTerms: user.acceptedTerms ? now : null,
      affirmedMajorityConsent: user.affirmedMajorityConsent ? now : null,
      affirmed13YearsOrOlder: user.affirmed13YearsOrOlder ? now : null,
      affirmedNotGdpr: user.affirmedNotGdpr ? now : null,
      isActive: true,
    };
    const userDataOut = await this.usersDao.createUser(
      createUserDataIn,
      creatorUserId,
      now
    );
    console.log({ userDataOutId: userDataOut.id });
    await Promise.all([
      this.authService.createOrUpdatePasswordAuthForUserId(
        userDataOut.id,
        password
      ),
      this.userExternalIdsDao.createExternalIdsForUserId(userDataOut.id),
      this.accountSettingsDao.createAccountSettingsForUserId(
        userDataOut.id,
        makeAccountSettings(),
        now
      ),
    ]);
    this.actionsService.asyncRecordAction(
      creatorUserId,
      userDataOut.created,
      ActionTypes.CREATE,
      ActionTargetTypes.USER,
      userDataOut.id
    );
    return userDataOut;
  }
};
