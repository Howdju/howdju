import { mockLogger } from "howdju-test-common";

import { AccountSettingsService } from "./AccountSettingsService";
import {
  AccountSettingsDao,
  AuthDao,
  CredentialValidator,
  Database,
  makePool,
  UsersDao,
} from "..";
import { AuthService } from "./AuthService";
import { AccountSettings } from "howdju-common";
import moment from "moment";
import { Pool } from "pg";
import { endPoolAndDropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import { CreateUserDataIn } from "@/daos/dataTypes";

describe("AccountSettingsService", () => {
  const dbConfig = makeTestDbConfig();
  let pool: Pool;
  let usersDao: UsersDao;
  let authService: AuthService;
  let service: AccountSettingsService;
  let dbName: string;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    const database = new Database(mockLogger, pool);
    const authDao = new AuthDao(mockLogger, database);
    usersDao = new UsersDao(mockLogger, database);
    const credentialValidator = new CredentialValidator();
    const apiConfig = {
      authTokenDuration: { days: 1 },
    };
    authService = new AuthService(
      apiConfig,
      mockLogger,
      credentialValidator,
      authDao,
      usersDao
    );
    const accountSettingsDao = new AccountSettingsDao(mockLogger, database);
    service = new AccountSettingsService(
      mockLogger,
      authService,
      accountSettingsDao
    );
  });
  afterEach(async () => {
    await endPoolAndDropDb(pool, dbConfig, dbName);
  });

  describe("createAccountSettings", () => {
    test("Creates account settings", async () => {
      // Arrange
      const accountSettings: AccountSettings = {
        paidContributionsDisclosure: "",
      };
      const now = moment.utc();
      const createUserData: CreateUserDataIn = {
        email: "the-user@the-domain.com",
        username: "the_user",
        shortName: "User",
        longName: "The User",
        phoneNumber: "1234567890",
        isActive: true,
        acceptedTerms: now,
        affirmedMajorityConsent: now,
        affirmed13YearsOrOlder: now,
        affirmedNotGdpr: now,
      };
      const user = await usersDao.createUser(
        createUserData,
        "100",
        moment.utc()
      );
      const { authToken } = await authService.createAuthToken(
        user,
        moment.utc()
      );

      // Act
      const { id } = await service.createAccountSettings(
        authToken,
        accountSettings
      );

      // Assert
      const actualAccountSettings = await service.readOrCreateAccountSettings(
        authToken
      );
      expect(actualAccountSettings).toMatchObject({
        ...accountSettings,
        id,
        userId: user.id,
      });
    });
  });

  describe("update", () => {
    test("Updates account settings", async () => {
      // Arrange
      const accountSettings: AccountSettings = {
        paidContributionsDisclosure: "",
      };

      const now = moment.utc();
      const createUserData: CreateUserDataIn = {
        email: "the-user@the-domain.com",
        username: "the_user",
        shortName: "User",
        longName: "The User",
        phoneNumber: "1234567890",
        isActive: true,
        acceptedTerms: now,
        affirmedMajorityConsent: now,
        affirmed13YearsOrOlder: now,
        affirmedNotGdpr: now,
      };
      const user = await usersDao.createUser(
        createUserData,
        "100",
        moment.utc()
      );
      const { authToken } = await authService.createAuthToken(
        user,
        moment.utc()
      );
      const { id } = await service.createAccountSettings(
        authToken,
        accountSettings
      );
      const updatedAccountSettings = {
        ...accountSettings,
        id,
        paidContributionsDisclosure: "the-paid-contributions-disclosure",
      };

      // Act
      await service.update(updatedAccountSettings, authToken);

      // Assert
      const actualAccountSettings = await service.readOrCreateAccountSettings(
        authToken
      );
      expect(actualAccountSettings).toMatchObject({
        ...updatedAccountSettings,
      });
    });
  });
});
