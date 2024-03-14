import moment from "moment";

import { AccountSettings } from "howdju-common";
import { mockLogger } from "howdju-test-common";

import { AccountSettingsService } from "./AccountSettingsService";
import { Database, PoolClientProvider, UsersDao } from "..";
import { makeTestProvider } from "@/initializers/TestProvider";
import { AuthService } from "./AuthService";
import {
  endPoolAndDropDb,
  initDb,
  makeTestClientProvider,
  makeTestDbConfig,
} from "@/util/testUtil";
import { CreateUserDataIn } from "@/daos/dataTypes";

describe("AccountSettingsService", () => {
  const dbConfig = makeTestDbConfig();
  let dbName: string;
  let clientProvider: PoolClientProvider;

  let service: AccountSettingsService;
  let usersDao: UsersDao;
  let authService: AuthService;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    clientProvider = makeTestClientProvider({
      ...dbConfig,
      database: dbName,
    });
    const database = new Database(mockLogger, clientProvider);

    const provider = makeTestProvider(database);

    service = provider.accountSettingsService;
    usersDao = provider.usersDao;
    authService = provider.authService;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
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
