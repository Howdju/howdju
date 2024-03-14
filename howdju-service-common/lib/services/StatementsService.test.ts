import { expect } from "@jest/globals";

import { CreateStatement, utcNow } from "howdju-common";
import { mockLogger } from "howdju-test-common";

import { Database, PoolClientProvider } from "../database";
import TestHelper from "@/initializers/TestHelper";
import {
  endPoolAndDropDb,
  initDb,
  makeTestClientProvider,
  makeTestDbConfig,
} from "@/util/testUtil";
import { makeTestProvider } from "@/initializers/TestProvider";
import { StatementsService } from "..";
import { merge } from "lodash";

const dbConfig = makeTestDbConfig();

describe("StatementsService", () => {
  let dbName: string;
  let clientProvider: PoolClientProvider;
  let database: Database;

  let service: StatementsService;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    clientProvider = makeTestClientProvider({
      ...dbConfig,
      database: dbName,
    });
    database = new Database(mockLogger, clientProvider);

    const provider = makeTestProvider(database);

    service = provider.statementsService;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
  });
  describe("doReadOrCreate", () => {
    test("creates a statement", async () => {
      const { user } = await testHelper.makeUser();
      const now = utcNow();
      const createStatement: CreateStatement = {
        speaker: {
          isOrganization: false,
          name: "Test Person",
        },
        sentenceType: "STATEMENT",
        sentence: {
          speaker: {
            isOrganization: true,
            name: "Test Organization",
          },
          sentenceType: "PROPOSITION",
          sentence: {
            text: "Test Proposition",
          },
        },
      };

      // Act
      const { isExtant, statement } = await service.doReadOrCreate(
        createStatement,
        user.id,
        now
      );

      const creator = {
        id: user.id,
        longName: user.longName,
      };
      expect(isExtant).toBe(false);
      expect(statement).toMatchObject(
        merge(createStatement, {
          id: expect.any(String),
          speaker: {
            id: expect.any(String),
            normalName: "test person",
            created: expect.toBeSameMoment(now),
            creatorUserId: user.id,
            creator,
          },
          sentence: {
            id: expect.any(String),
            speaker: {
              id: expect.any(String),
              normalName: "test organization",
              created: expect.toBeSameMoment(now),
              creatorUserId: user.id,
              creator,
            },
            sentence: {
              id: expect.any(String),
              normalText: "test proposition",
              slug: "test-proposition",
              created: expect.toBeSameMoment(now),
              creator,
            },
            created: expect.toBeSameMoment(now),
            creator,
          },
          created: expect.toBeSameMoment(now),
          creator,
        })
      );
    });
  });
  describe("readStatementForId", () => {
    test("reads a statement", async () => {
      const { user } = await testHelper.makeUser();
      const now = utcNow();
      const createStatement: CreateStatement = {
        speaker: {
          isOrganization: false,
          name: "Test Person",
        },
        sentenceType: "STATEMENT",
        sentence: {
          speaker: {
            isOrganization: true,
            name: "Test Organization",
          },
          sentenceType: "PROPOSITION",
          sentence: {
            text: "Test Proposition",
          },
        },
      };

      const { statement } = await service.doReadOrCreate(
        createStatement,
        user.id,
        now
      );

      // Act
      const readStatement = await service.readStatementForId(
        { userId: user.id },
        statement.id
      );

      // Assert
      expect(readStatement).toEqual(statement);
    });
  });
});
