import { mockLogger } from "howdju-test-common";

import {
  endPoolAndDropDb,
  initDb,
  makeTestClientProvider,
  makeTestDbConfig,
} from "@/util/testUtil";
import { Database, PoolClientProvider } from "../database";
import { makeTestProvider } from "@/initializers/TestProvider";
import TestHelper from "@/initializers/TestHelper";
import { PersorgsDao } from "./PersorgsDao";
import { CreatePersorg, utcNow } from "howdju-common";

const dbConfig = makeTestDbConfig();

describe("PersorgsDao", () => {
  let dbName: string;
  let clientProvider: PoolClientProvider;
  let database: Database;

  let dao: PersorgsDao;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    clientProvider = makeTestClientProvider({
      ...dbConfig,
      database: dbName,
    });
    database = new Database(mockLogger, clientProvider);

    const provider = makeTestProvider(database);

    dao = provider.persorgsDao;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
  });

  describe("readEquivalentPersorg", () => {
    test("reads an equivalent person without a known-for", async () => {
      const {
        user: { id: userId },
      } = await testHelper.makeUser();
      const createPersorg: CreatePersorg = {
        isOrganization: false,
        name: "Test Person",
      };
      const now = utcNow();
      const persorg = await dao.createPersorg(createPersorg, userId, now);

      // Act
      const equivalentPersorg = await dao.readEquivalentPersorg(createPersorg);

      expect(equivalentPersorg).toEqual(persorg);
    });
    test("reads an equivalent person with a known-for", async () => {
      const {
        user: { id: userId },
      } = await testHelper.makeUser();
      const createPersorg: CreatePersorg = {
        isOrganization: false,
        name: "Test Person",
        knownFor: "Making great soup",
      };
      const now = utcNow();
      const persorg = await dao.createPersorg(createPersorg, userId, now);

      // Act
      const equivalentPersorg = await dao.readEquivalentPersorg(createPersorg);

      expect(equivalentPersorg).toEqual(persorg);
    });
    test("doesn't read an equivalent person when known-for doesn't match", async () => {
      const {
        user: { id: userId },
      } = await testHelper.makeUser();
      const createPersorg: CreatePersorg = {
        isOrganization: false,
        name: "Test Person",
        knownFor: "Making great soup",
      };
      const now = utcNow();
      await dao.createPersorg(createPersorg, userId, now);

      // Act
      const equivalentPersorg = await dao.readEquivalentPersorg({
        ...createPersorg,
        knownFor: "Very friendly",
      });

      expect(equivalentPersorg).toBeUndefined();
    });
    test("doesn't read a person as equivalent to an organization", async () => {
      const {
        user: { id: userId },
      } = await testHelper.makeUser();
      const createPersorg: CreatePersorg = {
        isOrganization: false,
        name: "Test Name",
      };
      const now = utcNow();
      await dao.createPersorg(createPersorg, userId, now);

      // Act
      const equivalentPersorg = await dao.readEquivalentPersorg({
        isOrganization: true,
        name: "Test Name",
      });

      expect(equivalentPersorg).toBeUndefined();
    });
    test("doesn't read an organization as equivalent to a person", async () => {
      const {
        user: { id: userId },
      } = await testHelper.makeUser();
      const createPersorg: CreatePersorg = {
        isOrganization: true,
        name: "Test Name",
      };
      const now = utcNow();
      await dao.createPersorg(createPersorg, userId, now);

      // Act
      const equivalentPersorg = await dao.readEquivalentPersorg({
        isOrganization: false,
        name: "Test Name",
      });

      expect(equivalentPersorg).toBeUndefined();
    });
  });
  describe("createPersorg", () => {
    test("cannot create an equivalent person", async () => {
      const {
        user: { id: userId },
      } = await testHelper.makeUser();
      const createPersorg: CreatePersorg = {
        isOrganization: false,
        name: "Test Person",
        knownFor: undefined,
      };

      await dao.createPersorg(createPersorg, userId, utcNow());
      let err: Error | undefined = undefined;

      // Act
      try {
        await dao.createPersorg(createPersorg, userId, utcNow());
      } catch (e) {
        if (!(e instanceof Error)) {
          throw e;
        }
        err = e;
      }

      // Assert
      expect(err).toBeDefined();
      expect(err?.message).toContain(
        `duplicate key value violates unique constraint "persorg_person_unique_idx"`
      );
    });
  });
});
