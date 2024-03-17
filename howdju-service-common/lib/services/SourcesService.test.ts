import { CreateSource, utcNow } from "howdju-common";
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
import { SourcesService } from "./SourcesService";

const dbConfig = makeTestDbConfig();

describe("SourcesService", () => {
  let dbName: string;
  let clientProvider: PoolClientProvider;

  let service: SourcesService;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    clientProvider = makeTestClientProvider({
      ...dbConfig,
      database: dbName,
    });
    const database = new Database(mockLogger, clientProvider);

    const provider = makeTestProvider(database);

    service = provider.sourcesService;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
  });

  describe("readOrCreateSource", () => {
    test("returns an equivalent source", async () => {
      // Arrange
      const { user } = await testHelper.makeUser();
      const createSource: CreateSource = {
        description: "the source description",
      };
      const created = utcNow();
      const { isExtant: isExtantInitial, source } =
        await service.readOrCreateSource(user.id, createSource, created);

      // Act
      const { isExtant, source: sourceSecond } =
        await service.readOrCreateSource(user.id, createSource, created);

      // Assert
      expect(isExtantInitial).toBe(false);
      expect(isExtant).toBe(true);
      expect(source).toEqual(expectToBeSameMomentDeep(sourceSecond));
    });
  });
});
