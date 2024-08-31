import { utcNow } from "howdju-common";
import { mockLogger } from "howdju-test-common";

import {
  endPoolAndDropDb,
  initDb,
  makeTestClientProvider,
  makeTestDbConfig,
} from "@/util/testUtil";
import { Database, PoolClientProvider } from "../database";
import { makeTestProvider } from "@/initializers/TestProvider";
import TestHelper from "@/initializers/TestHelper";
import { AuthService } from "./AuthService";
import { AuthDao, UnauthenticatedError } from "..";

const dbConfig = makeTestDbConfig();

describe("AuthService", () => {
  let dbName: string;
  let clientProvider: PoolClientProvider;
  let database: Database;

  let service: AuthService;
  let dao: AuthDao;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    clientProvider = makeTestClientProvider({
      ...dbConfig,
      database: dbName,
    });
    database = new Database(mockLogger, clientProvider);

    const provider = makeTestProvider(database);

    service = provider.authService;
    dao = provider.authDao;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
  });

  describe("readAuthRefreshToken", () => {
    test("can refresh auth", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const password = "123456-is-the-password-to-my-luggage";
      await service.createOrUpdatePasswordAuthForUserId(userId, password);
      const result = await service.login({ email: user.email, password });

      const { authToken, authTokenExpiration } = await service.refreshAuth(
        result.authRefreshToken
      );

      expect(authToken).toBeDefined();
      expect(authTokenExpiration.isAfter(utcNow())).toBeTrue();
    });
    test("if auth refresh token has expired, throw an error", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const authRefreshToken = "the-auth-refresh-token";
      const created = utcNow();
      const expires = created;
      await dao.createAuthRefreshToken(
        userId,
        authRefreshToken,
        created,
        expires
      );

      await expect(service.refreshAuth(authRefreshToken)).rejects.toThrow(
        UnauthenticatedError
      );
    });
  });
});
