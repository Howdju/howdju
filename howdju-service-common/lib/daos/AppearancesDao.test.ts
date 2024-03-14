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
import { AppearancesDao } from "./AppearancesDao";

const dbConfig = makeTestDbConfig();

describe("AppearancesDao", () => {
  let dbName: string;
  let clientProvider: PoolClientProvider;
  let database: Database;

  let dao: AppearancesDao;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    clientProvider = makeTestClientProvider({
      ...dbConfig,
      database: dbName,
    });
    database = new Database(mockLogger, clientProvider);

    const provider = makeTestProvider(database);

    dao = provider.appearancesDao;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
  });

  describe("createAppearanceReturningId", () => {
    test("creates an Appearance and returns its ID", async () => {
      const {
        user: { id: userId },
      } = await testHelper.makeUser();
      const { id: mediaExcerptId } = await testHelper.makeMediaExcerpt({
        userId,
      });
      const { id: propositionId } = await testHelper.makeProposition({
        userId,
      });
      const createdAt = utcNow();

      // Act
      const id = await dao.createAppearanceReturningId(
        userId,
        mediaExcerptId,
        {
          propositionId,
        },
        createdAt
      );

      // Assert
      expect(id).toEqual(expect.any(String));
    });
  });

  describe("readEquivalentAppearanceId", () => {
    test("returns undefined when there is no equivalent Appearance", async () => {
      const {
        user: { id: userId },
      } = await testHelper.makeUser();
      const { id: mediaExcerptId } = await testHelper.makeMediaExcerpt({
        userId,
      });
      const propositionId = "94812";

      // Act
      const id = await dao.readEquivalentAppearanceId(userId, mediaExcerptId, {
        propositionId,
      });

      // Assert
      expect(id).toBeUndefined();
    });
    test("returns an equivalent Appearance ID", async () => {
      const {
        user: { id: userId },
      } = await testHelper.makeUser();
      const { id: mediaExcerptId } = await testHelper.makeMediaExcerpt({
        userId,
      });
      const { id: propositionId } = await testHelper.makeProposition({
        userId,
      });
      const appearanceId = await dao.createAppearanceReturningId(
        userId,
        mediaExcerptId,
        {
          propositionId,
        },
        utcNow()
      );

      // Act
      const id = await dao.readEquivalentAppearanceId(userId, mediaExcerptId, {
        propositionId,
      });

      // Assert
      expect(id).toBe(appearanceId);
    });
  });
});
