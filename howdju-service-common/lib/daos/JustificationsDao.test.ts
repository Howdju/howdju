import assign from "lodash/assign";
import moment from "moment";
import { expect } from "@jest/globals";

import { JustificationsDao } from "./JustificationsDao";
import { mockLogger } from "howdju-test-common";
import {
  dropDb,
  expectToBeSameMomentDeep,
  initDb,
  makeTestDbConfig,
} from "@/util/testUtil";
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
import { CreateJustificationDataIn } from "./dataTypes";
import {
  JustificationRef,
  negateRootPolarity,
  PropositionCompoundRef,
  StatementRef,
  WritQuoteRef,
} from "howdju-common";
import { SortDescription } from "./daoTypes";

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
      const expectedJustification = assign({}, createJustificationData, {
        id: expect.any(String),
        counterJustifications: [],
        creator: { id: userId },
        created: expect.toBeSameMoment(now),
        rootPolarity: createJustificationData.polarity,
      });
      expect(justificationData).toEqual(
        expect.objectContaining(expectedJustification)
      );
    });
  });

  describe("readJustificationForId", () => {
    test("reads a justification for an ID", async () => {
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
      const expectedJustificationData = assign({}, createJustificationData, {
        id: expect.any(String),
        counterJustifications: [],
        creator: { id: user.id },
        created: expect.toBeSameMoment(now),
        rootPolarity: createJustificationData.polarity,
        rootTarget: expectToBeSameMomentDeep(statementData),
      });
      expect(justificationData.creator).toEqual(
        expectedJustificationData.creator
      );
      expect(justificationData).toMatchObject(expectedJustificationData);
    });
  });

  describe("readJustifications", () => {
    test("reads justifications", async () => {
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

      const rootTargetType = "STATEMENT";
      const rootTarget = StatementRef.parse({ id: statementId });

      const createJustificationData: CreateJustificationDataIn = {
        rootTargetType,
        rootTarget,
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
      const { id: justificationId } = await dao.createJustification(
        createJustificationData,
        user.id,
        now
      );

      const createCounterJustificationData: CreateJustificationDataIn = {
        rootTargetType,
        rootTarget,
        polarity: "NEGATIVE",
        target: {
          type: "JUSTIFICATION",
          entity: JustificationRef.parse({ id: justificationId }),
        },
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: PropositionCompoundRef.parse({ id: "2" }),
        },
      };
      await dao.createJustification(
        createCounterJustificationData,
        user.id,
        now
      );

      // Act
      const filters = {};
      const sorts: SortDescription[] = [];
      const count = 10;
      const isContinuation = false;
      const includeUrls = true;
      const justifications = await dao.readJustifications(
        filters,
        sorts,
        count,
        isContinuation,
        includeUrls
      );

      // Assert
      const commonExpectations = {
        id: expect.any(String),
        counterJustifications: [],
        creator: { id: user.id },
        created: expect.toBeSameMoment(now),
        rootTarget: statementData,
      };
      const expectedJustificationData = assign({}, createJustificationData, {
        ...commonExpectations,
        rootPolarity: createJustificationData.polarity,
      });
      const expectedCounterJustificationData = assign(
        {},
        createCounterJustificationData,
        {
          ...commonExpectations,
          rootPolarity: negateRootPolarity(createJustificationData.polarity),
        }
      );
      expect(justifications).toMatchObject([
        expectedJustificationData,
        expectedCounterJustificationData,
      ]);
    });
  });

  describe("readJustificationsForRootTarget", () => {
    test("read justifications for proposition root target", async () => {
      // Create a countered writquote justification and a proposition compound disjustification
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

      const rootTargetType = "STATEMENT";
      const rootTarget = StatementRef.parse({ id: statementId });

      const createProjustificationData: CreateJustificationDataIn = {
        rootTargetType,
        rootTarget,
        polarity: "POSITIVE",
        target: {
          type: rootTargetType,
          entity: rootTarget,
        },
        basis: {
          type: "WRIT_QUOTE",
          entity: WritQuoteRef.parse({ id: "2" }),
        },
      };
      const { id: projustificationId } = await dao.createJustification(
        createProjustificationData,
        user.id,
        now
      );
      const createCounterJustificationData: CreateJustificationDataIn = {
        rootTargetType,
        rootTarget,
        polarity: "NEGATIVE",
        target: {
          type: "JUSTIFICATION",
          entity: JustificationRef.parse({ id: projustificationId }),
        },
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: PropositionCompoundRef.parse({ id: "2" }),
        },
      };
      const { id: counterJustificationId } = await dao.createJustification(
        createCounterJustificationData,
        user.id,
        now
      );

      const createDisjustificationData: CreateJustificationDataIn = {
        rootTargetType,
        rootTarget,
        polarity: "NEGATIVE",
        target: {
          type: "STATEMENT",
          entity: rootTarget,
        },
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: PropositionCompoundRef.parse({ id: "2" }),
        },
      };
      const { id: disjustificationId } = await dao.createJustification(
        createDisjustificationData,
        user.id,
        now
      );

      // Act
      const filters = {};
      const sorts: SortDescription[] = [];
      const count = 10;
      const isContinuation = false;
      const includeUrls = true;
      const justifications = await dao.readJustifications(
        filters,
        sorts,
        count,
        isContinuation,
        includeUrls
      );

      // Assert
      const commonExpectations = {
        counterJustifications: [],
        creator: { id: user.id },
        created: expect.toBeSameMoment(now),
        rootTarget: statementData,
      };
      const expectedProjustificationData = assign(
        {},
        createProjustificationData,
        {
          ...commonExpectations,
          id: projustificationId,
          rootPolarity: "POSITIVE",
        }
      );
      const expectedCounterJustificationData = assign(
        {},
        createCounterJustificationData,
        {
          ...commonExpectations,
          id: counterJustificationId,
          rootPolarity: "NEGATIVE",
        }
      );
      const expectedDisjustificationData = assign(
        {},
        createDisjustificationData,
        {
          ...commonExpectations,
          id: disjustificationId,
          rootPolarity: "NEGATIVE",
        }
      );
      expect(justifications).toMatchObject([
        expectedProjustificationData,
        expectedCounterJustificationData,
        expectedDisjustificationData,
      ]);
    });
  });
});
