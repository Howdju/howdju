import bcrypt from "bcryptjs";
import { Moment } from "moment";

import {
  ActionTypes,
  ActionTargetTypes,
  EntityTypes,
  makeAccountSettings,
  utcNow,
  CreateUser,
  EntityId,
  AuthToken,
  newImpossibleError,
} from "howdju-common";

import {
  AccountSettingsDao,
  ActionsService,
  ApiConfig,
  AuthService,
  PermissionsService,
  UserExternalIdsDao,
  UsersDao,
} from "..";
import { permissions } from "../permissions";
import { EntityNotFoundError } from "../serviceErrors";
import { HashTypes } from "../hashTypes";

export class UsersService {
  constructor(
    private readonly config: ApiConfig,
    private readonly actionsService: ActionsService,
    private readonly authService: AuthService,
    private readonly permissionsService: PermissionsService,
    private readonly userExternalIdsDao: UserExternalIdsDao,
    private readonly usersDao: UsersDao,
    private readonly accountSettingsDao: AccountSettingsDao
  ) {}

  async isEmailInUse(email: string) {
    return await this.usersDao.isEmailInUse(email);
  }

  async isUsernameInUse(username: string) {
    return await this.usersDao.isUsernameInUse(username);
  }

  async createUserAsAuthToken(authToken: AuthToken, user: CreateUser) {
    const creatorUserId =
      await this.permissionsService.readUserIdHavingPermissionForAuthToken(
        authToken,
        permissions.CREATE_USERS
      );
    return await this.createUserAsUser(creatorUserId, user, undefined);
  }

  async readUserForId(userId: EntityId) {
    return await this.usersDao.readUserForId(userId);
  }

  async readUserForEmail(email: string) {
    return await this.usersDao.readUserForEmail(email);
  }

  async updatePasswordForEmail(email: string, password: string) {
    const user = await this.usersDao.readUserForEmail(email);
    if (!user) {
      throw new EntityNotFoundError(EntityTypes.USER, email);
    }
    const [user_1] = await Promise.all([
      user,
      this.authService.createOrUpdatePasswordAuthForUserId(user.id, password),
    ]);
    return user_1;
  }

  async createRegisteredUser(
    createUser: CreateUser,
    password: string,
    now: Moment
  ) {
    const passwordHash = await bcrypt.hash(
      password,
      this.config.auth.bcrypt.saltRounds
    );
    const passwordHashType = HashTypes.BCRYPT;
    const createUserData = {
      ...createUser,
      acceptedTerms: now,
      affirmedMajorityConsent: now,
      affirmed13YearsOrOlder: now,
      affirmedNotGdpr: now,
      isActive: true,
    };
    const createdUser = await this.usersDao.createUser(
      createUserData,
      undefined,
      now
    );
    await Promise.all([
      this.authService.createPasswordHashAuthForUserId(
        createdUser.id,
        passwordHash,
        passwordHashType
      ),
      this.userExternalIdsDao.createExternalIdsForUserId(createdUser.id),
    ]);
    await this.actionsService.recordAction(
      createdUser.id,
      createdUser.created,
      ActionTypes.CREATE,
      ActionTargetTypes.USER,
      createdUser.id
    );
    const user = await this.usersDao.readUserForId(createdUser.id);
    if (!user) {
      throw newImpossibleError(
        `Failed to read User we just created (ID: ${createdUser.id})`
      );
    }
    return user;
  }

  /**
   * Create a user.
   *
   * If password is undefined, the user cannot login until they reset their password.
   */
  async createUserAsUser(
    creatorUserId: EntityId,
    createUser: CreateUser,
    password: string | undefined
  ) {
    const now = utcNow();
    const createUserDataIn = {
      ...createUser,
      acceptedTerms: now,
      affirmedMajorityConsent: now,
      affirmed13YearsOrOlder: now,
      affirmedNotGdpr: now,
      isActive: true,
    };
    const userDataOut = await this.usersDao.createUser(
      createUserDataIn,
      creatorUserId,
      now
    );

    await Promise.all([
      password &&
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

  readCreatorInfoForId(creatorUserId: EntityId) {
    return this.usersDao.readUserBlurbForId(creatorUserId);
  }
}
