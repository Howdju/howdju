import { expectToBeSameMomentDeep, mockLogger } from "howdju-test-common";

import {
  endPoolAndDropDb,
  initDb,
  makeTestClientProvider,
  makeTestDbConfig,
} from "@/util/testUtil";
import { Database, PoolClientProvider } from "../database";
import { makeTestProvider } from "@/initializers/TestProvider";
import TestHelper from "@/initializers/TestHelper";
import { PersorgsService } from "./PersorgsService";
import { utcNow } from "howdju-common";

const dbConfig = makeTestDbConfig();

// isOrg=false knownFor=null
describe("PersorgsService", () => {
  let dbName: string;
  let clientProvider: PoolClientProvider;

  let service: PersorgsService;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    clientProvider = makeTestClientProvider({
      ...dbConfig,
      database: dbName,
    });
    const database = new Database(mockLogger, clientProvider);

    const provider = makeTestProvider(database);

    service = provider.persorgsService;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
  });

  describe("readOrCreateValidPersorgAsUser", () => {
    test("re-uses an existing person having a knownFor", async () => {
      const { user } = await testHelper.makeUser();
      const createPersorg = {
        name: "Juan Doe",
        isOrganization: false,
        knownFor: "acting",
      };
      const created = utcNow();
      const { persorg: persorg1 } =
        await service.readOrCreateValidPersorgAsUser(
          createPersorg,
          user.id,
          created
        );

      // Act
      const { isExtant, persorg: persorg2 } =
        await service.readOrCreateValidPersorgAsUser(
          createPersorg,
          user.id,
          created
        );

      // Assert
      expect(isExtant).toBeTrue();
      expect(persorg2).toEqual(expectToBeSameMomentDeep(persorg1));
    });
    test("re-uses an existing person missing a knownFor", async () => {
      const { user } = await testHelper.makeUser();
      const createPersorg = {
        name: "Juan Doe",
        isOrganization: false,
      };
      const created = utcNow();
      const { persorg: persorg1 } =
        await service.readOrCreateValidPersorgAsUser(
          createPersorg,
          user.id,
          created
        );

      // Act
      const { isExtant, persorg: persorg2 } =
        await service.readOrCreateValidPersorgAsUser(
          createPersorg,
          user.id,
          created
        );

      // Assert
      expect(isExtant).toBeTrue();
      expect(persorg2).toEqual(expectToBeSameMomentDeep(persorg1));
    });
    test("re-uses an existing organization", async () => {
      const { user } = await testHelper.makeUser();
      const createPersorg = {
        name: "ACME Corp.",
        isOrganization: true,
      };
      const created = utcNow();
      const { persorg: persorg1 } =
        await service.readOrCreateValidPersorgAsUser(
          createPersorg,
          user.id,
          created
        );

      // Act
      const { isExtant, persorg: persorg2 } =
        await service.readOrCreateValidPersorgAsUser(
          createPersorg,
          user.id,
          created
        );

      // Assert
      expect(isExtant).toBeTrue();
      expect(persorg2).toEqual(expectToBeSameMomentDeep(persorg1));
    });
  });
});
