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
import { SourceDescriptionSearcher } from "./searchers";

const dbConfig = makeTestDbConfig();

describe("sourceDescriptionSearcher", () => {
  let dbName: string;
  let clientProvider: PoolClientProvider;

  let searcher: SourceDescriptionSearcher;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    clientProvider = makeTestClientProvider({
      ...dbConfig,
      database: dbName,
    });
    const database = new Database(mockLogger, clientProvider);

    const provider = makeTestProvider(database);

    searcher = provider.sourceDescriptionSearcher;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
  });

  describe("search", () => {
    test("returns sources by description", async () => {
      const { user } = await testHelper.makeUser();
      const fooSources = await Promise.all(
        new Array(3)
          .fill(0)
          .map((_x, i) =>
            testHelper.makeSource(user.id, { description: `foo ${i}` })
          )
      );
      await Promise.all(
        new Array(3).fill(0).map((_x, i) =>
          testHelper.makeSource(user.id, {
            description: `bar ${i}`,
          })
        )
      );
      const authToken = "auth-token";

      const sources = await searcher.search(authToken, "foo");

      expect(sources).toIncludeSameMembers(
        expectToBeSameMomentDeep(fooSources)
      );
    });
  });
});
