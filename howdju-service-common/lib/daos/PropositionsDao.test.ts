import { Pool } from "pg";

import { CreateProposition, utcNow } from "howdju-common";
import { expectToBeSameMomentDeep, mockLogger } from "howdju-test-common";

import { endPoolAndDropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import { Database, makePool } from "../database";
import { PropositionsDao } from "../daos";
import { makeTestProvider } from "@/initializers/TestProvider";
import TestHelper from "@/initializers/TestHelper";

const dbConfig = makeTestDbConfig();

describe("PropositionsDao", () => {
  let dbName: string;
  let pool: Pool;

  let dao: PropositionsDao;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    const database = new Database(mockLogger, pool);

    const provider = makeTestProvider(database);

    dao = provider.propositionsDao;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(pool, dbConfig, dbName);
  });

  describe("readPropositionByText", () => {
    it("returns a proposition by text", async () => {
      // Arrange
      const { user } = await testHelper.makeUser();
      const text = "Stanly is the very model of a modern Major-General";
      const proposition: CreateProposition = { text };
      const created = utcNow();
      await dao.createProposition(user.id, proposition, created);

      // Act
      const result = await dao.readPropositionByText(text);

      // Assert
      expect(result).toEqual(
        expectToBeSameMomentDeep({
          ...proposition,
          id: expect.any(String),
          created,
          normalText: "stanly is the very model of a modern majorgeneral",
          slug: "stanly-is-the-very-model-of-a-modern-major-general",
          creator: {
            id: user.id,
            longName: user.longName,
          },
        })
      );
    });

    it("returns undefined when no proposition has the text", async () => {
      // Arrange
      const { user } = await testHelper.makeUser();
      const text = "Stanly is the very model of a modern Major-General";
      const proposition: CreateProposition = { text };
      await dao.createProposition(user.id, proposition, utcNow());

      // Act
      const result = await dao.readPropositionByText("foo");

      // Assert
      expect(result).toBeUndefined();
    });
  });
});
