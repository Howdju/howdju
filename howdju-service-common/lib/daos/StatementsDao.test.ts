import { CreatePersorg, CreateProposition, utcNow } from "howdju-common";
import { mockLogger } from "howdju-test-common";

import { StatementsDao } from "./StatementsDao";
import { Database, PoolClientProvider } from "../database";
import TestHelper from "@/initializers/TestHelper";
import {
  endPoolAndDropDb,
  initDb,
  makeTestClientProvider,
  makeTestDbConfig,
} from "@/util/testUtil";
import { makeTestProvider } from "@/initializers/TestProvider";
import { PersorgsService, PropositionsService } from "..";

const dbConfig = makeTestDbConfig();

describe("StatementsDao", () => {
  let dbName: string;
  let clientProvider: PoolClientProvider;
  let database: Database;

  let dao: StatementsDao;
  let propositionsService: PropositionsService;
  let persorgsService: PersorgsService;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    clientProvider = makeTestClientProvider({
      ...dbConfig,
      database: dbName,
    });
    database = new Database(mockLogger, clientProvider);

    const provider = makeTestProvider(database);

    dao = provider.statementsDao;
    propositionsService = provider.propositionsService;
    persorgsService = provider.persorgsService;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
  });
  describe("readStatementForId", () => {
    test("reads a statement for an ID", async () => {
      const {
        user: { id: userId },
      } = await testHelper.makeUser();
      const createProposition: CreateProposition = {
        text: "Test Proposition",
      };
      const { proposition } = await propositionsService.readOrCreateProposition(
        { userId },
        createProposition
      );

      const createPersorg: CreatePersorg = {
        isOrganization: false,
        name: "Test Person",
      };
      const now = utcNow();
      const { persorg } = await persorgsService.readOrCreateValidPersorgAsUser(
        createPersorg,
        userId,
        now
      );
      const createStatement = {
        speaker: persorg,
        sentenceType: "PROPOSITION" as const,
        sentence: proposition,
      };

      const createdStatement = await dao.createStatement(
        {
          ...createStatement,
          speaker: persorg,
        },
        proposition.id,
        userId,
        now
      );

      // Act
      const readStatement = await dao.readStatementForId(createdStatement.id);

      expect(readStatement).toMatchObject(createdStatement);
    });
  });
  describe("readStatementChainForId", () => {
    test("reads a chain for a statement", async () => {
      const {
        user: { id: userId },
      } = await testHelper.makeUser();
      const createProposition: CreateProposition = {
        text: "Test Proposition",
      };
      const { proposition } = await propositionsService.readOrCreateProposition(
        { userId },
        createProposition
      );

      const createPersorg: CreatePersorg = {
        isOrganization: false,
        name: "Test Person",
      };
      const now = utcNow();
      const { persorg } = await persorgsService.readOrCreateValidPersorgAsUser(
        createPersorg,
        userId,
        now
      );
      const createStatement1 = {
        speaker: persorg,
        sentenceType: "PROPOSITION" as const,
        sentence: proposition,
      };

      const createdStatement1 = await dao.createStatement(
        createStatement1,
        proposition.id,
        userId,
        now
      );
      const createStatement2 = {
        speaker: persorg,
        sentenceType: "STATEMENT" as const,
        sentence: createdStatement1,
      };

      const createdStatement2 = await dao.createStatement(
        createStatement2,
        proposition.id,
        userId,
        now
      );

      // Act
      const chain = await dao.readStatementChainForId(createdStatement2.id);

      expect(chain).toEqual([
        {
          statementId: createdStatement1.id,
          sentenceType: "PROPOSITION",
          sentenceId: proposition.id,
        },
        {
          statementId: createdStatement2.id,
          sentenceType: "STATEMENT",
          sentenceId: createdStatement1.id,
        },
      ]);
    });
  });
});
