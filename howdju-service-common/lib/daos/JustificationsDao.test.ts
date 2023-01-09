import assign from "lodash/assign";
import moment from "moment";
import { expect } from "@jest/globals";

import { JustificationsDao } from "./JustificationsDao";
import { mockLogger } from "howdju-test-common";
import { dropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import { Pool } from "pg";
import {
  AuthService,
  Database,
  makePool,
  PersorgsDao,
  PropositionsDao,
  StatementsService,
  UsersDao,
} from "..";
import TestProvider from "@/initializers/TestProvider";
import { CreateJustificationDataIn } from "./types";
import { PropositionCompoundRef, StatementRef } from "howdju-common";

describe("JustificationsDao", () => {
  const dbConfig = makeTestDbConfig();
  let pool: Pool;
  let dao: JustificationsDao;
  let dbName: string;
  let statementsService: StatementsService;
  let persorgsDao: PersorgsDao;
  let propositionsDao: PropositionsDao;
  let usersDao: UsersDao;
  let authService: AuthService;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    const database = new Database(mockLogger, pool);

    const provider = new TestProvider(database);

    dao = (provider as any).justificationsDao;
    statementsService = (provider as any).statementsService;
    persorgsDao = (provider as any).persorgsDao;
    propositionsDao = (provider as any).propositionsDao;
    usersDao = (provider as any).usersDao;
    authService = (provider as any).authService;
  });
  afterEach(async () => {
    await pool.end();
    await dropDb(dbConfig, dbName);
  });

  describe("createJustification", () => {
    test("creates a statement justification", async () => {
      // Arrange
      const targetId = "1";
      const userId = "4";
      const now = moment();
      const createJustificationData: CreateJustificationDataIn = {
        rootTargetType: "STATEMENT",
        rootTarget: StatementRef.parse({ id: targetId }),
        polarity: "NEGATIVE",
        target: {
          type: "STATEMENT",
          entity: StatementRef.parse({ id: targetId }),
        },
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: PropositionCompoundRef.parse({ id: "2" }),
        },
      };

      // Act
      const justificationData = await dao.createJustification(
        createJustificationData,
        userId,
        now
      );

      // Assert
      expect(justificationData.id).toEqual(expect.any(String));
      const expectedJustification = assign({}, createJustificationData, {
        counterJustifications: [],
        creator: { id: userId },
        created: expect.toBeSameMoment(now),
        deleted: null,
        rootPolarity: createJustificationData.polarity,
      });
      expect(justificationData).toEqual(
        expect.objectContaining(expectedJustification)
      );
    });
  });

  describe("readJustificationForId", () => {
    test("Can read a justification for an ID", async () => {
      // Arrange
      const now = moment();
      const creatorUserId = null;
      const userData = {
        email: "user@domain.com",
        username: "the-username",
        isActive: true,
      };

      const user = await usersDao.createUser(userData, creatorUserId, now);
      const { authToken } = await authService.createAuthToken(user, now);

      const proposition = await propositionsDao.createProposition(
        user.id,
        {
          text: "A fine wee proposition.",
        },
        now
      );
      const speaker = await persorgsDao.createPersorg(
        {
          isOrganization: false,
          name: "Williford von Rutherford",
        },
        user.id,
        now
      );
      const createStatementData = {
        speaker,
        sentenceType: "PROPOSITION",
        sentence: proposition,
      };
      const { statement: statementData } = await statementsService.readOrCreate(
        createStatementData,
        authToken
      );
      const { id: statementId } = statementData;

      const createJustificationData: CreateJustificationDataIn = {
        rootTargetType: "STATEMENT",
        rootTarget: StatementRef.parse({ id: statementId }),
        polarity: "NEGATIVE",
        target: {
          type: "STATEMENT",
          entity: StatementRef.parse({ id: statementId }),
        },
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: PropositionCompoundRef.parse({ id: "2" }),
        },
      };
      const { id } = await dao.createJustification(
        createJustificationData,
        user.id,
        now
      );

      // Act
      const justificationData = await dao.readJustificationForId(id);

      // Assert
      expect(justificationData.id).toEqual(expect.any(String));
      const expectedJustificationData = assign({}, createJustificationData, {
        counterJustifications: [],
        creator: { id: user.id },
        created: expect.toBeSameMoment(now),
        rootPolarity: createJustificationData.polarity,
        rootTarget: statementData,
      });
      expect(justificationData).toMatchObject(expectedJustificationData);
    });
  });
});
