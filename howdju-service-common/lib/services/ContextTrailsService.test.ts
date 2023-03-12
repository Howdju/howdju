import { Pool } from "pg";

import { ContextTrailItemInfo } from "howdju-common";
import { mockLogger } from "howdju-test-common";

import { endPoolAndDropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import {
  AuthService,
  ContextTrailsService,
  Database,
  InvalidRequestError,
  makePool,
  UsersDao,
} from "..";
import { makeTestProvider } from "@/initializers/TestProvider";
import moment from "moment";

const dbConfig = makeTestDbConfig();

describe("ContextTrailsService", () => {
  let dbName: string;
  let pool: Pool;

  let service: ContextTrailsService;
  let usersDao: UsersDao;
  let authService: AuthService;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    const database = new Database(mockLogger, pool);

    const provider = makeTestProvider(database);

    service = provider.contextTrailsService;
    usersDao = provider.usersDao;
    authService = provider.authService;
  });
  afterEach(async () => {
    await endPoolAndDropDb(pool, dbConfig, dbName);
  });
  describe("readContextTrail", () => {
    test("throws InvalidRequestError for trail longer than 32", async () => {
      const { authToken } = await makeUser();

      const contextTrailInfos: ContextTrailItemInfo[] = Array(33).fill({
        connectingEntityType: "JUSTIFICATION",
        connectingEntityId: "1",
        polarity: "POSITIVE",
      });
      const focusEntityType = "PROPOSITION";
      const focusEntityId = "2";

      await expect(
        async () =>
          await service.readContextTrail(
            authToken,
            contextTrailInfos,
            focusEntityType,
            focusEntityId
          )
      ).rejects.toThrow(InvalidRequestError);
    });
  });

  async function makeUser() {
    const now = moment();
    const creatorUserId = null;
    const userData = {
      email: "user@domain.com",
      username: "the-username",
      isActive: true,
    };

    const user = await usersDao.createUser(userData, creatorUserId, now);
    const { authToken } = await authService.createAuthToken(user, now);

    return { user, authToken };
  }
});
