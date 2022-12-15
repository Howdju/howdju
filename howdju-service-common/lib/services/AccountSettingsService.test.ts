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
import { AccountSettings, UserData } from "howdju-common";
import moment from "moment";
import { toNumber } from "lodash";
import { Pool } from "pg";
import { initDb } from "@/util/testUtil";

describe("AccountSettingsService", () => {
  let pool: Pool;
  let usersDao: UsersDao;
  let authService: AuthService;
  let service: AccountSettingsService;
  beforeEach(async () => {
    const dbConfig = {
      user: process.env.DB_USER,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      port: toNumber(process.env.DB_PORT),
      max: toNumber(process.env.DB_MAX_CONNECTIONS),
    };
    await initDb(dbConfig);

    pool = makePool(mockLogger, dbConfig);
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
    await pool.end();
  });

  describe("createAccountSettings", () => {
    test("Creates account settings", async () => {
      // Arrange
      const accountSettings: AccountSettings = {
        paidContributionsDisclosure: "",
      };
      const now = moment.utc();
      const userData: UserData = {
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
      const user = await usersDao.createUser(userData, "100", moment.utc());
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
      const userData: UserData = {
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
      const user = await usersDao.createUser(userData, "100", moment.utc());
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
