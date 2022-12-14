import { readFileSync } from "fs";

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
import { PoolConfig } from "pg";
import { toNumber } from "lodash";

async function initDb(config: PoolConfig) {
  const { database: dbname, ...ddlConfig } = config;
  // This pool does not connect to the DB, so it will work even if the DB doesn't exist, which it
  // shouldn't with a fresh server.
  const noDbPool = makePool(mockLogger, ddlConfig);
  await noDbPool.query(`DROP DATABASE IF EXISTS ${dbname};`);
  await noDbPool.query(`CREATE DATABASE ${dbname};`);
  noDbPool.end();

  // This pool connects to the database.
  const dbPool = makePool(mockLogger, config);
  const ddl = readFileSync("./test-data/premiser_test_schema_dump.sql", {
    encoding: "utf8",
    flag: "r",
  });
  await dbPool.query(ddl);
  dbPool.end();
}

describe("AccountSettingsService", () => {
  describe("createAccountSettings", () => {
    test("Creates account settings", async () => {
      // Arrange
      const dbConfig = {
        user: process.env.DB_USER,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        port: toNumber(process.env.DB_PORT),
        max: toNumber(process.env.DB_MAX_CONNECTIONS),
      };
      await initDb(dbConfig);

      const pool = makePool(mockLogger, dbConfig);
      const database = new Database(mockLogger, pool);
      const authDao = new AuthDao(mockLogger, database);
      const usersDao = new UsersDao(mockLogger, database);
      const credentialValidator = new CredentialValidator();
      const apiConfig = {
        authTokenDuration: { days: 1 },
      };
      const authService = new AuthService(
        apiConfig,
        mockLogger,
        credentialValidator,
        authDao,
        usersDao
      );
      const accountSettingsDao = new AccountSettingsDao(mockLogger, database);
      const service = new AccountSettingsService(
        mockLogger,
        authService,
        accountSettingsDao
      );
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
      await service.createAccountSettings(authToken, accountSettings);
      const actualAccountSettings = await service.readOrCreateAccountSettings(
        authToken
      );

      // Assert
      expect(actualAccountSettings).toMatchObject({
        ...accountSettings,
        userId: user.id,
      });

      pool.end();
    });
  });
});
