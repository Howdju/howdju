import assign from "lodash/assign";
import moment from "moment";
import { expect } from "@jest/globals";

import { JustificationsDao } from "./JustificationsDao";
import { mockLogger, expectToBeSameMomentDeep } from "howdju-test-common";
import { endPoolAndDropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import { Pool } from "pg";
import {
  AuthService,
  Database,
  makePool,
  PersorgsDao,
  PropositionsDao,
  StatementsService,
  PropositionCompoundsService,
  UsersDao,
  WritQuotesService,
} from "..";
import { makeTestProvider } from "@/initializers/TestProvider";
import { CreateJustificationDataIn } from "./dataTypes";
import {
  JustificationRef,
  negateRootPolarity,
  PropositionCompoundRef,
  StatementRef,
  SortDescription,
  CreatePropositionCompound,
  CreateWritQuote,
  EntityId,
  PropositionCompound,
  Persisted,
  AuthToken,
  User,
} from "howdju-common";

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
  let propositionCompoundsService: PropositionCompoundsService;
  let writQuotesService: WritQuotesService;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    const database = new Database(mockLogger, pool);

    const provider = makeTestProvider(database);

    dao = provider.justificationsDao;
    statementsService = provider.statementsService;
    persorgsDao = provider.persorgsDao;
    propositionsDao = provider.propositionsDao;
    usersDao = provider.usersDao;
    authService = provider.authService;
    propositionCompoundsService = provider.propositionCompoundsService;
    writQuotesService = provider.writQuotesService;
  });
  afterEach(async () => {
    await endPoolAndDropDb(pool, dbConfig, dbName);
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
      const { user, authToken } = await makeUser();
      const statementData = await makeStatement({ user, authToken });

      const propositionCompound = await makePropositionCompound({
        userId: user.id,
      });

      const createJustificationData: CreateJustificationDataIn = {
        rootTargetType: "STATEMENT",
        rootTarget: StatementRef.parse({ id: statementData.id }),
        polarity: "NEGATIVE",
        target: {
          type: "STATEMENT",
          entity: StatementRef.parse({ id: statementData.id }),
        },
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: propositionCompound,
        },
      };

      const now = moment();
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
      expect(justificationData).toMatchObject(expectedJustificationData);
      expect(justificationData?.creator).toEqual(
        expectedJustificationData.creator
      );
    });
  });

  describe("readJustifications", () => {
    test("reads justifications", async () => {
      // Arrange
      const { user, authToken } = await makeUser();

      const statementData = await makeStatement({ user, authToken });

      const rootTargetType = "STATEMENT";
      const rootTarget = StatementRef.parse({ id: statementData.id });

      const propositionCompound1 = await makePropositionCompound({
        userId: user.id,
        text: "What if a much of a wind 1",
      });
      const propositionCompound2 = await makePropositionCompound({
        userId: user.id,
        text: "What if a much of a wind 2",
      });

      const createJustificationData: CreateJustificationDataIn = {
        rootTargetType,
        rootTarget,
        polarity: "NEGATIVE",
        target: {
          type: "STATEMENT",
          entity: StatementRef.parse({ id: statementData.id }),
        },
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: propositionCompound1,
        },
      };
      const now = moment();
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
          entity: propositionCompound2,
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

    test("read pro and con justifications", async () => {
      // Create a countered writquote justification and a proposition compound disjustification
      // Arrange
      const { user, authToken } = await makeUser();

      const statementData = await makeStatement({ user, authToken });
      const statementId = statementData.id;

      const rootTargetType = "STATEMENT";
      const rootTarget = StatementRef.parse({ id: statementId });

      const writQuote = await makeWritQuote({ authToken });

      const propositionCompound1 = await makePropositionCompound({
        userId: user.id,
        text: "What if a much of a wind 1",
      });
      const propositionCompound2 = await makePropositionCompound({
        userId: user.id,
        text: "What if a much of a wind 2",
      });

      const now = moment();
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
          entity: writQuote,
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
          entity: propositionCompound1,
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
          entity: propositionCompound2,
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

  async function makeUser() {
    const now = moment();
    const creatorUserId = null;
    const userData = {
      email: "user@domain.com",
      username: "the-username",
      isActive: true,
    };

    const user = await usersDao.createUser(userData, creatorUserId, now);
    const { authToken } = await authService.createAuthToken(user, now);
    return { user, authToken };
  }

  async function makeStatement({
    user,
    authToken,
  }: {
    user: User;
    authToken: AuthToken;
  }) {
    const now = moment();
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
    const { statement } = await statementsService.readOrCreate(
      createStatementData,
      authToken
    );
    return statement;
  }

  async function makePropositionCompound({
    userId,
    text = "Socrates is mortal",
  }: {
    userId: EntityId;
    text?: string;
  }): Promise<Persisted<PropositionCompound>> {
    const now = moment();
    const createPropositionCompound: CreatePropositionCompound = {
      atoms: [
        {
          entity: {
            text,
          },
        },
      ],
    };
    const { propositionCompound } =
      await propositionCompoundsService.createValidPropositionCompoundAsUser(
        createPropositionCompound,
        userId,
        now
      );
    return propositionCompound;
  }

  async function makeWritQuote({ authToken }: { authToken: AuthToken }) {
    const createWritQuote: CreateWritQuote = {
      quoteText: "What if a much of a wind",
      writ: {
        title: "Leaves of grass",
      },
      urls: [],
    };
    const { writQuote } = await writQuotesService.createWritQuote({
      authToken,
      writQuote: createWritQuote,
    });
    return writQuote;
  }
});
