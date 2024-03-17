import { ContextTrailItemInfo } from "howdju-common";
import { mockLogger, expectToBeSameMomentDeep } from "howdju-test-common";

import {
  endPoolAndDropDb,
  initDb,
  makeTestClientProvider,
  makeTestDbConfig,
} from "@/util/testUtil";
import {
  AuthService,
  ConflictError,
  ContextTrailsService,
  Database,
  EntityNotFoundError,
  InvalidRequestError,
  JustificationsService,
  PoolClientProvider,
  PropositionCompoundsService,
  PropositionsService,
  UsersDao,
} from "..";
import { makeTestProvider } from "@/initializers/TestProvider";
import moment from "moment";

const dbConfig = makeTestDbConfig();

describe("ContextTrailsService", () => {
  let dbName: string;
  let clientProvider: PoolClientProvider;

  let service: ContextTrailsService;
  let usersDao: UsersDao;
  let authService: AuthService;
  let propositionsService: PropositionsService;
  let propositionCompoundsService: PropositionCompoundsService;
  let justificationsService: JustificationsService;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    clientProvider = makeTestClientProvider({
      ...dbConfig,
      database: dbName,
    });
    const database = new Database(mockLogger, clientProvider);

    const provider = makeTestProvider(database);

    service = provider.contextTrailsService;
    usersDao = provider.usersDao;
    authService = provider.authService;
    propositionsService = provider.propositionsService;
    propositionCompoundsService = provider.propositionCompoundsService;
    justificationsService = provider.justificationsService;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
  });
  describe("readContextTrail", () => {
    test("throws InvalidRequestError for trail longer than 32", async () => {
      const { authToken } = await makeUser();

      const contextTrailInfos: ContextTrailItemInfo[] = Array(33).fill({
        connectingEntityType: "JUSTIFICATION",
        connectingEntityId: "1",
        polarity: "POSITIVE",
      });

      await expect(
        async () => await service.readContextTrail(authToken, contextTrailInfos)
      ).rejects.toThrow(InvalidRequestError);
    });

    test("Reads a valid context trail", async () => {
      const { authToken, user } = await makeUser();

      const { proposition } = await propositionsService.readOrCreateProposition(
        { authToken },
        {
          text: "A fine wee proposition.",
        }
      );
      const { proposition: basisProposition1 } =
        await propositionsService.readOrCreateProposition(
          { authToken },
          {
            text: "A fine wee proposition 1.",
          }
        );
      const now = moment();
      const { propositionCompound: propositionCompound1 } =
        await propositionCompoundsService.createValidPropositionCompoundAsUser(
          {
            atoms: [{ entity: basisProposition1 }],
          },
          user.id,
          now
        );
      const { justification } = await justificationsService.readOrCreate(
        {
          target: {
            type: "PROPOSITION",
            entity: proposition,
          },
          polarity: "POSITIVE",
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: propositionCompound1,
          },
        },
        authToken
      );
      const { proposition: basisProposition2 } =
        await propositionsService.readOrCreateProposition(
          { authToken },
          {
            text: "A fine wee proposition 2.",
          }
        );
      const { propositionCompound: propositionCompound2 } =
        await propositionCompoundsService.createValidPropositionCompoundAsUser(
          {
            atoms: [{ entity: basisProposition2 }],
          },
          user.id,
          now
        );
      const { justification: justification2 } =
        await justificationsService.readOrCreate(
          {
            target: {
              type: "PROPOSITION",
              entity: basisProposition1,
            },
            polarity: "POSITIVE",
            basis: {
              type: "PROPOSITION_COMPOUND",
              entity: propositionCompound2,
            },
          },
          authToken
        );

      const contextTrailInfos: ContextTrailItemInfo[] = [
        {
          connectingEntityType: "JUSTIFICATION",
          connectingEntityId: justification.id,
          polarity: justification.polarity,
        },
        {
          connectingEntityType: "JUSTIFICATION",
          connectingEntityId: justification2.id,
          polarity: justification2.polarity,
        },
      ];

      // Act
      const trailItems = await service.readContextTrail(
        authToken,
        contextTrailInfos
      );

      expect(trailItems).toMatchObject([
        {
          connectingEntityType: "JUSTIFICATION",
          connectingEntityId: justification.id,
          polarity: justification.polarity,
          connectingEntity: expectToBeSameMomentDeep(justification),
        },
        {
          connectingEntityType: "JUSTIFICATION",
          connectingEntityId: justification2.id,
          polarity: justification2.polarity,
          connectingEntity: expectToBeSameMomentDeep(justification2),
        },
      ]);
    });

    test("Throws not found for a missing trail entity", async () => {
      const { authToken } = await makeUser();
      const contextTrailInfos: ContextTrailItemInfo[] = [
        {
          connectingEntityType: "JUSTIFICATION",
          connectingEntityId: "1",
          polarity: "POSITIVE",
        },
      ];

      await expect(
        async () => await service.readContextTrail(authToken, contextTrailInfos)
      ).rejects.toThrow(EntityNotFoundError);
    });

    test("Throws conflict for a context trail with wrong justification", async () => {
      const { authToken, user } = await makeUser();

      const { proposition } = await propositionsService.readOrCreateProposition(
        { authToken },
        {
          text: "A fine wee proposition.",
        }
      );
      const { proposition: basisProposition1 } =
        await propositionsService.readOrCreateProposition(
          { authToken },
          {
            text: "A fine wee proposition 1.",
          }
        );
      const now = moment();
      const { propositionCompound: propositionCompound1 } =
        await propositionCompoundsService.createValidPropositionCompoundAsUser(
          {
            atoms: [{ entity: basisProposition1 }],
          },
          user.id,
          now
        );
      const { justification } = await justificationsService.readOrCreate(
        {
          target: {
            type: "PROPOSITION",
            entity: proposition,
          },
          polarity: "POSITIVE",
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: propositionCompound1,
          },
        },
        authToken
      );

      // A justification that doesn't target a proposition in the first one's basis
      const { proposition: proposition2 } =
        await propositionsService.readOrCreateProposition(
          { authToken },
          {
            text: "A fine wee proposition 2.",
          }
        );
      const { proposition: basisProposition2 } =
        await propositionsService.readOrCreateProposition(
          { authToken },
          {
            text: "A fine wee proposition 3.",
          }
        );
      const { propositionCompound: propositionCompound2 } =
        await propositionCompoundsService.createValidPropositionCompoundAsUser(
          {
            atoms: [{ entity: basisProposition2 }],
          },
          user.id,
          now
        );
      const { justification: justification2 } =
        await justificationsService.readOrCreate(
          {
            target: {
              type: "PROPOSITION",
              entity: proposition2,
            },
            polarity: "POSITIVE",
            basis: {
              type: "PROPOSITION_COMPOUND",
              entity: propositionCompound2,
            },
          },
          authToken
        );

      const contextTrailInfos: ContextTrailItemInfo[] = [
        {
          connectingEntityType: "JUSTIFICATION",
          connectingEntityId: justification.id,
          polarity: justification.polarity,
        },
        {
          connectingEntityType: "JUSTIFICATION",
          connectingEntityId: justification2.id,
          polarity: justification2.polarity,
        },
      ];
      await expect(
        async () => await service.readContextTrail(authToken, contextTrailInfos)
      ).rejects.toThrow(ConflictError);
    });

    test("Throws conflict for a context trail with incorrect polarity", async () => {
      const { authToken, user } = await makeUser();

      const { proposition } = await propositionsService.readOrCreateProposition(
        { authToken },
        {
          text: "A fine wee proposition.",
        }
      );
      const { proposition: basisProposition1 } =
        await propositionsService.readOrCreateProposition(
          { authToken },
          {
            text: "A fine wee proposition 1.",
          }
        );
      const now = moment();
      const { propositionCompound: propositionCompound1 } =
        await propositionCompoundsService.createValidPropositionCompoundAsUser(
          {
            atoms: [{ entity: basisProposition1 }],
          },
          user.id,
          now
        );
      const { justification } = await justificationsService.readOrCreate(
        {
          target: {
            type: "PROPOSITION",
            entity: proposition,
          },
          polarity: "POSITIVE",
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: propositionCompound1,
          },
        },
        authToken
      );

      const contextTrailInfos: ContextTrailItemInfo[] = [
        {
          connectingEntityType: "JUSTIFICATION",
          connectingEntityId: justification.id,
          // The wrong polarity
          polarity: "NEGATIVE",
        },
      ];
      await expect(
        async () => await service.readContextTrail(authToken, contextTrailInfos)
      ).rejects.toThrow(ConflictError);
    });
  });

  async function makeUser() {
    const now = moment();
    const creatorUserId = undefined;
    const userData = {
      email: "user@domain.com",
      username: "the-username",
      isActive: true,
      longName: "The User",
      shortName: "User",
      acceptedTerms: now,
      affirmed13YearsOrOlder: now,
      affirmedMajorityConsent: now,
      affirmedNotGdpr: now,
    };

    const user = await usersDao.createUser(userData, creatorUserId, now);
    const { authToken } = await authService.createAuthToken(user, now);

    return { user, authToken };
  }
});
