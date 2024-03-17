import {
  CreateJustification,
  CreateProposition,
  PropositionCompoundOut,
} from "howdju-common";
import { mockLogger } from "howdju-test-common";

import {
  Database,
  JustificationsService,
  makeTestProvider,
  PoolClientProvider,
  PropositionsService,
} from "..";
import {
  endPoolAndDropDb,
  initDb,
  makeTestClientProvider,
  makeTestDbConfig,
} from "@/util/testUtil";
import TestHelper from "@/initializers/TestHelper";

describe("PropositionsService", () => {
  const dbConfig = makeTestDbConfig();
  let dbName: string;
  let clientProvider: PoolClientProvider;

  let service: PropositionsService;
  let testHelper: TestHelper;
  let justificationsService: JustificationsService;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    clientProvider = makeTestClientProvider({
      ...dbConfig,
      database: dbName,
    });
    const database = new Database(mockLogger, clientProvider);

    const provider = makeTestProvider(database);

    service = provider.propositionsService;
    testHelper = provider.testHelper;
    justificationsService = provider.justificationsService;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
  });

  describe("deleteProposition", () => {
    test("can delete unused proposition", async () => {
      const { authToken } = await testHelper.makeUser();
      const proposition: CreateProposition = {
        text: "Howdy",
      };

      const {
        proposition: { id: propositionId },
      } = await service.readOrCreateProposition({ authToken }, proposition);

      const { deletedPropositionId, deletedJustificationIds } =
        await service.deleteProposition(authToken, propositionId);

      expect(deletedPropositionId).toBe(propositionId);
      expect(deletedJustificationIds).toEqual([]);
    });

    test("can delete proposition used in a compound-based justification", async () => {
      const { authToken } = await testHelper.makeUser();

      const createJustification = makePropositionCompoundBasedJustification([
        "Socrates is a man",
        "All men are mortal",
      ]);

      // Act
      const { justification } = await justificationsService.readOrCreate(
        createJustification,
        authToken
      );

      const propositionId = (
        justification.basis.entity as PropositionCompoundOut
      ).atoms[0].entity.id;
      const { deletedPropositionId, deletedJustificationIds } =
        await service.deleteProposition(authToken, propositionId);

      expect(deletedPropositionId).toBe(propositionId);
      expect(deletedJustificationIds).toEqual([justification.id]);
    });
  });
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
