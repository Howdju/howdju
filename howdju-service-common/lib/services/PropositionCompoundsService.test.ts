import { Pool } from "pg";

import { expectToBeSameMomentDeep, mockLogger } from "howdju-test-common";
import { CreatePropositionCompound, utcNow } from "howdju-common";

import { Database, makePool } from "..";
import { endPoolAndDropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import { PropositionCompoundsService } from "./PropositionCompoundsService";
import { makeTestProvider } from "@/initializers/TestProvider";
import TestHelper from "@/initializers/TestHelper";

const dbConfig = makeTestDbConfig();

describe("PropositionCompoundsService", () => {
  let dbName: string;
  let pool: Pool;

  let service: PropositionCompoundsService;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    const database = new Database(mockLogger, pool);

    const provider = makeTestProvider(database);

    service = provider.propositionCompoundsService;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(pool, dbConfig, dbName);
  });
  describe("readPropositionCompoundForId", () => {
    test("reads a proposition compound", async () => {
      const { user } = await testHelper.makeUser();
      const createPropositionCompound: CreatePropositionCompound = {
        atoms: [
          { entity: { text: "Socrates is a person" } },
          { entity: { text: "All people are mortal" } },
        ],
      };
      const created = utcNow();

      const { propositionCompound } =
        await service.createPropositionCompoundAsUser(
          createPropositionCompound,
          user.id,
          created
        );

      // Act
      const readPropositionCompound =
        await service.readPropositionCompoundForId(propositionCompound.id);

      // Assert
      expect(readPropositionCompound).toStrictEqual(
        expectToBeSameMomentDeep(propositionCompound)
      );
    });
  });

  describe("createPropositionCompoundAsUser", () => {
    test("creates a proposition compound", async () => {
      const { user } = await testHelper.makeUser();
      const createPropositionCompound: CreatePropositionCompound = {
        atoms: [
          { entity: { text: "Socrates is a person" } },
          { entity: { text: "All people are mortal" } },
        ],
      };
      const created = utcNow();

      const { propositionCompound, isExtant } =
        await service.createPropositionCompoundAsUser(
          createPropositionCompound,
          user.id,
          created
        );

      expect(propositionCompound).toMatchObject(
        expectToBeSameMomentDeep({
          ...createPropositionCompound,
          id: expect.any(String),
          created,
          creatorUserId: user.id,
        })
      );
      expect(isExtant).toBe(false);
    });
    test("re-uses an extant proposition compound", async () => {
      const { user } = await testHelper.makeUser();
      const createPropositionCompound: CreatePropositionCompound = {
        atoms: [
          { entity: { text: "Socrates is a person" } },
          { entity: { text: "All people are mortal" } },
        ],
      };
      const created = utcNow();

      const { propositionCompound: extantPropositionCompound } =
        await service.createPropositionCompoundAsUser(
          createPropositionCompound,
          user.id,
          created
        );

      // Act
      const { propositionCompound, isExtant } =
        await service.createPropositionCompoundAsUser(
          createPropositionCompound,
          user.id,
          created
        );

      // Assert
      expect(isExtant).toBe(true);
      expect(propositionCompound).toStrictEqual(
        expectToBeSameMomentDeep(extantPropositionCompound)
      );
    });

    test("doesn't re-use a proposition compound having a superset of atoms", async () => {
      const { user } = await testHelper.makeUser();
      const createPropositionCompound: CreatePropositionCompound = {
        atoms: [
          { entity: { text: "Socrates is a person" } },
          { entity: { text: "All people are mortal" } },
          { entity: { text: "Mortals like cookies" } },
        ],
      };
      const created = utcNow();

      const { propositionCompound: extantPropositionCompound } =
        await service.createPropositionCompoundAsUser(
          createPropositionCompound,
          user.id,
          created
        );
      const createPropositionCompound2: CreatePropositionCompound = {
        atoms: [
          { entity: { text: "Socrates is a person" } },
          { entity: { text: "All people are mortal" } },
        ],
      };

      // Act
      const { propositionCompound, isExtant } =
        await service.createPropositionCompoundAsUser(
          createPropositionCompound2,
          user.id,
          created
        );

      // Assert
      expect(isExtant).toBe(false);
      expect(propositionCompound.id).not.toBe(extantPropositionCompound.id);
    });
  });
});
