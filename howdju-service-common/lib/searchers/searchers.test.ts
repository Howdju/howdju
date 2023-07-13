import { Pool } from "pg";

import { expectToBeSameMomentDeep, mockLogger } from "howdju-test-common";

import { endPoolAndDropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import { Database, makePool } from "../database";
import { makeTestProvider } from "@/initializers/TestProvider";
import TestHelper from "@/initializers/TestHelper";
import { SourceDescriptionSearcher } from "./searchers";

const dbConfig = makeTestDbConfig();

describe("sourcesDescriptionSearcher", () => {
  let dbName: string;
  let pool: Pool;

  let searcher: SourceDescriptionSearcher;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    const database = new Database(mockLogger, pool);

    const provider = makeTestProvider(database);

    searcher = provider.sourceDescriptionSearcher;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(pool, dbConfig, dbName);
  });

  describe("search", () => {
    test("returns sources by description", async () => {
      const { user } = await testHelper.makeUser();
      const fooSources = await Promise.all(
        new Array(3)
          .fill(0)
          .map(async (_x, i) =>
            testHelper.makeSource(user.id, { description: `foo ${i}` })
          )
      );
      await Promise.all(
        new Array(3).fill(0).map(
          async (_x, i) =>
            await testHelper.makeSource(user.id, {
              description: `bar ${i}`,
            })
        )
      );

      const sources = await searcher.search("foo");

      expect(sources).toIncludeSameMembers(
        expectToBeSameMomentDeep(fooSources)
      );
    });
  });
});
