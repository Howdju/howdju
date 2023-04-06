import { Pool } from "pg";
import moment from "moment";

import { mockLogger } from "howdju-test-common";

import {
  AuthService,
  Database,
  JustificationsService,
  makePool,
  makeTestProvider,
  PropositionsService,
  UsersDao,
} from "..";

import { endPoolAndDropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import {
  CreateJustification,
  CreateProposition,
  PropositionCompound,
} from "howdju-common";

describe("PropositionsService", () => {
  const dbConfig = makeTestDbConfig();
  let dbName: string;
  let pool: Pool;

  let service: PropositionsService;
  let usersDao: UsersDao;
  let authService: AuthService;
  let justificationsService: JustificationsService;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    const database = new Database(mockLogger, pool);

    const provider = makeTestProvider(database);

    service = provider.propositionsService;
    usersDao = provider.usersDao;
    authService = provider.authService;
    justificationsService = provider.justificationsService;
  });
  afterEach(async () => {
    await endPoolAndDropDb(pool, dbConfig, dbName);
  });

  describe("deleteProposition", () => {
    test("can delete unused proposition", async () => {
      const { authToken } = await makeUser();
      const proposition: CreateProposition = {
        text: "Howdy",
      };

      const {
        proposition: { id: propositionId },
      } = await service.readOrCreateProposition(authToken, proposition);

      const { deletedPropositionId, deletedJustificationIds } =
        await service.deleteProposition(authToken, propositionId);

      expect(deletedPropositionId).toBe(propositionId);
      expect(deletedJustificationIds).toEqual([]);
    });

    test("can delete proposition used in a compound-based justification", async () => {
      const { authToken } = await makeUser();

      const createJustification = makePropositionCompoundBasedJustification([
        "Socrates is a man",
        "All men are mortal",
      ]);

      // Act
      const { justification } = await justificationsService.readOrCreate(
        createJustification,
        authToken
      );

      const propositionId = (justification.basis.entity as PropositionCompound)
        .atoms[0].entity.id;
      const { deletedPropositionId, deletedJustificationIds } =
        await service.deleteProposition(authToken, propositionId);

      expect(deletedPropositionId).toBe(propositionId);
      expect(deletedJustificationIds).toEqual([justification.id]);
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
});

function makePropositionCompoundBasedJustification(
  texts: [string, ...string[]]
): CreateJustification {
  return {
    target: {
      type: "PROPOSITION",
      entity: {
        text: "Socrates is mortal.",
      },
    },
    basis: {
      type: "PROPOSITION_COMPOUND",
      entity: {
        atoms: texts.map((text) => ({
          entity: {
            text,
          },
        })),
      },
    },
    polarity: "POSITIVE",
  };
}
