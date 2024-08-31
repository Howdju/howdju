import { momentAdd, utcNow } from "howdju-common";
import { expectToBeSameMomentDeep, mockLogger } from "howdju-test-common";

import {
  endPoolAndDropDb,
  initDb,
  makeTestClientProvider,
  makeTestDbConfig,
} from "@/util/testUtil";
import { Database, PoolClientProvider } from "../database";
import { makeTestProvider } from "@/initializers/TestProvider";
import TestHelper from "@/initializers/TestHelper";
import { AuthDao } from "./AuthDao";

const dbConfig = makeTestDbConfig();

describe("AuthDao", () => {
  let dbName: string;
  let clientProvider: PoolClientProvider;
  let database: Database;

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

    dao = provider.authDao;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
  });
  describe("readAuthRefreshToken", () => {
    test("can read an auth refresh token", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const authRefreshToken = "the-auth-refresh-token";
      const created = utcNow();
      const expires = momentAdd(utcNow(), { days: 1 });
      await dao.createAuthRefreshToken(
        userId,
        authRefreshToken,
        created,
        expires
      );

      const result = await dao.readAuthRefreshToken(authRefreshToken);

      expect(result).toEqual(expectToBeSameMomentDeep({ userId, expires }));
    });
  });
});
