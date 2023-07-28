import { Pool } from "pg";

import { momentAdd, momentSubtract, utcNow } from "howdju-common";
import { expectToBeSameMomentDeep, mockLogger } from "howdju-test-common";

import { endPoolAndDropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import { Database, makePool } from "../database";
import { makeTestProvider } from "@/initializers/TestProvider";
import TestHelper from "@/initializers/TestHelper";
import { UrlLocatorAutoConfirmationDao } from "./UrlLocatorAutoConfirmationDao";
import { MediaExcerptsDao } from "./MediaExcerptsDao";
import { MediaExcerptsService } from "..";

const dbConfig = makeTestDbConfig();

describe("UrlLocatorAutoConfirmationDao", () => {
  let dbName: string;
  let pool: Pool;
  let database: Database;

  let dao: UrlLocatorAutoConfirmationDao;
  let mediaExcerptsService: MediaExcerptsService;
  let mediaExcerptsDao: MediaExcerptsDao;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    database = new Database(mockLogger, pool);

    const provider = makeTestProvider(database);

    dao = provider.urlLocatorAutoConfirmationDao;
    mediaExcerptsService = provider.mediaExcerptsService;
    mediaExcerptsDao = provider.mediaExcerptsDao;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(pool, dbConfig, dbName);
  });

  describe("readConfirmationStatusForUrlLocatorId", () => {
    test("returns NEVER_TRIED if no confirmation results exist", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const createdAt = utcNow();
      const { mediaExcerpt } = await mediaExcerptsDao.readOrCreateMediaExcerpt(
        {
          localRep: {
            quotation: "the stored quotation",
          },
        },
        userId,
        createdAt,
        /* createUrlLocators= */ [],
        /* createCitations= */ []
      );
      const {
        urlLocators: [urlLocator],
      } = await mediaExcerptsService.createUrlLocators(
        { userId: user.id },
        mediaExcerpt.id,
        [{ url: { url: "https://example.com" } }]
      );

      // Act
      const status = await dao.readConfirmationStatusForUrlLocatorId(
        urlLocator.id
      );

      // Assert
      expect(status).toEqual({
        status: "NEVER_TRIED",
      });
    });
    test("returns NEVER_FOUND if only one NOT_FOUND results exist", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const createdAt = utcNow();
      const quotation = "the stored quotation";
      const { mediaExcerpt } = await mediaExcerptsDao.readOrCreateMediaExcerpt(
        { localRep: { quotation } },
        userId,
        createdAt,
        /* createUrlLocators= */ [],
        /* createCitations= */ []
      );
      const url = "https://example.com";
      const {
        urlLocators: [urlLocator],
      } = await mediaExcerptsService.createUrlLocators(
        { userId: user.id },
        mediaExcerpt.id,
        [{ url: { url: "https://example.com" } }]
      );
      const notFoundAt = utcNow();
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: notFoundAt,
        status: "NOT_FOUND",
        quotation,
      });

      // Act
      const status = await dao.readConfirmationStatusForUrlLocatorId(
        urlLocator.id
      );

      // Assert
      expect(status).toEqual(
        expectToBeSameMomentDeep({
          status: "NEVER_FOUND",
          earliestNotFoundAt: notFoundAt,
          latestNotFoundAt: notFoundAt,
        })
      );
    });
    test("returns NEVER_FOUND if only multiple NOT_FOUND results exist", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const createdAt = utcNow();
      const quotation = "the stored quotation";
      const { mediaExcerpt } = await mediaExcerptsDao.readOrCreateMediaExcerpt(
        { localRep: { quotation } },
        userId,
        createdAt,
        /* createUrlLocators= */ [],
        /* createCitations= */ []
      );
      const url = "https://example.com";
      const {
        urlLocators: [urlLocator],
      } = await mediaExcerptsService.createUrlLocators(
        { userId: user.id },
        mediaExcerpt.id,
        [{ url: { url: "https://example.com" } }]
      );
      const latestNotFoundAt = utcNow();
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: latestNotFoundAt,
        status: "NOT_FOUND",
        quotation,
      });
      const earliestNotFoundAt = momentSubtract(latestNotFoundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: earliestNotFoundAt,
        status: "NOT_FOUND",
        quotation,
      });

      // Act
      const status = await dao.readConfirmationStatusForUrlLocatorId(
        urlLocator.id
      );

      // Assert
      expect(status).toEqual(
        expectToBeSameMomentDeep({
          status: "NEVER_FOUND",
          earliestNotFoundAt,
          latestNotFoundAt,
        })
      );
    });
    test("returns FOUND if only one FOUND result exist", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const createdAt = utcNow();
      const quotation = "the stored quotation";
      const { mediaExcerpt } = await mediaExcerptsDao.readOrCreateMediaExcerpt(
        { localRep: { quotation } },
        userId,
        createdAt,
        /* createUrlLocators= */ [],
        /* createCitations= */ []
      );
      const url = "https://example.com";
      const {
        urlLocators: [urlLocator],
      } = await mediaExcerptsService.createUrlLocators(
        { userId: user.id },
        mediaExcerpt.id,
        [{ url: { url: "https://example.com" } }]
      );
      const latestFoundAt = utcNow();
      const foundQuotation = "the found quotation";
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: latestFoundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });
      const earliestFoundAt = latestFoundAt;

      // Act
      const status = await dao.readConfirmationStatusForUrlLocatorId(
        urlLocator.id
      );

      // Assert
      expect(status).toEqual(
        expectToBeSameMomentDeep({
          status: "FOUND",
          latestFoundAt,
          earliestFoundAt,
          foundQuotation,
        })
      );
    });
    test("returns FOUND if only multiple FOUND results exist", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const createdAt = utcNow();
      const quotation = "the stored quotation";
      const { mediaExcerpt } = await mediaExcerptsDao.readOrCreateMediaExcerpt(
        { localRep: { quotation } },
        userId,
        createdAt,
        /* createUrlLocators= */ [],
        /* createCitations= */ []
      );
      const url = "https://example.com";
      const {
        urlLocators: [urlLocator],
      } = await mediaExcerptsService.createUrlLocators(
        { userId: user.id },
        mediaExcerpt.id,
        [{ url: { url: "https://example.com" } }]
      );
      const latestFoundAt = utcNow();
      const foundQuotation = "the found quotation";
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: latestFoundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });
      const earliestFoundAt = momentSubtract(latestFoundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: earliestFoundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });

      // Act
      const status = await dao.readConfirmationStatusForUrlLocatorId(
        urlLocator.id
      );

      // Assert
      expect(status).toEqual(
        expectToBeSameMomentDeep({
          status: "FOUND",
          latestFoundAt,
          earliestFoundAt,
          foundQuotation,
        })
      );
    });
    test("returns FOUND if it was found once recently and also before", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const createdAt = utcNow();
      const quotation = "the stored quotation";
      const { mediaExcerpt } = await mediaExcerptsDao.readOrCreateMediaExcerpt(
        { localRep: { quotation } },
        userId,
        createdAt,
        /* createUrlLocators= */ [],
        /* createCitations= */ []
      );
      const url = "https://example.com";
      const {
        urlLocators: [urlLocator],
      } = await mediaExcerptsService.createUrlLocators(
        { userId: user.id },
        mediaExcerpt.id,
        [{ url: { url: "https://example.com" } }]
      );

      const foundQuotation = "the found quotation";

      const previouslyFoundAt = utcNow();
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: previouslyFoundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });

      const notFoundAt = momentAdd(previouslyFoundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: notFoundAt,
        status: "NOT_FOUND",
        quotation,
      });

      const foundAt = momentAdd(notFoundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: foundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });

      // Act
      const status = await dao.readConfirmationStatusForUrlLocatorId(
        urlLocator.id
      );

      // Assert
      expect(status).toEqual(
        expectToBeSameMomentDeep({
          status: "FOUND",
          latestFoundAt: foundAt,
          earliestFoundAt: foundAt,
          foundQuotation,
        })
      );
    });
    test("returns FOUND if it was found once recently only", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const createdAt = utcNow();
      const quotation = "the stored quotation";
      const { mediaExcerpt } = await mediaExcerptsDao.readOrCreateMediaExcerpt(
        { localRep: { quotation } },
        userId,
        createdAt,
        /* createUrlLocators= */ [],
        /* createCitations= */ []
      );
      const url = "https://example.com";
      const {
        urlLocators: [urlLocator],
      } = await mediaExcerptsService.createUrlLocators(
        { userId: user.id },
        mediaExcerpt.id,
        [{ url: { url: "https://example.com" } }]
      );
      const notFoundAt = utcNow();
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: notFoundAt,
        status: "NOT_FOUND",
        quotation,
      });
      const latestFoundAt = momentAdd(notFoundAt, { hour: 1 });
      const foundQuotation = "the found quotation";
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: latestFoundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });

      // Act
      const status = await dao.readConfirmationStatusForUrlLocatorId(
        urlLocator.id
      );

      // Assert
      expect(status).toEqual(
        expectToBeSameMomentDeep({
          status: "FOUND",
          latestFoundAt,
          earliestFoundAt: latestFoundAt,
          foundQuotation,
        })
      );
    });
    test("returns FOUND if it was found multiple times recently but not before", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const createdAt = utcNow();
      const quotation = "the stored quotation";
      const { mediaExcerpt } = await mediaExcerptsDao.readOrCreateMediaExcerpt(
        { localRep: { quotation } },
        userId,
        createdAt,
        /* createUrlLocators= */ [],
        /* createCitations= */ []
      );
      const url = "https://example.com";
      const {
        urlLocators: [urlLocator],
      } = await mediaExcerptsService.createUrlLocators(
        { userId: user.id },
        mediaExcerpt.id,
        [{ url: { url: "https://example.com" } }]
      );

      const notFoundAt = utcNow();
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: notFoundAt,
        status: "NOT_FOUND",
        quotation,
      });

      const foundQuotation = "the found quotation";
      const earliestFoundAt = momentAdd(notFoundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: earliestFoundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });
      const latestFoundAt = momentAdd(earliestFoundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: latestFoundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });

      // Act
      const status = await dao.readConfirmationStatusForUrlLocatorId(
        urlLocator.id
      );

      // Assert
      expect(status).toEqual(
        expectToBeSameMomentDeep({
          status: "FOUND",
          latestFoundAt,
          earliestFoundAt,
          foundQuotation,
        })
      );
    });
    test("returns PREVIOUSLY_FOUND if it was found multiple times before and not found multiple times recently", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const createdAt = utcNow();
      const quotation = "the stored quotation";
      const { mediaExcerpt } = await mediaExcerptsDao.readOrCreateMediaExcerpt(
        { localRep: { quotation } },
        userId,
        createdAt,
        /* createUrlLocators= */ [],
        /* createCitations= */ []
      );
      const url = "https://example.com";
      const {
        urlLocators: [urlLocator],
      } = await mediaExcerptsService.createUrlLocators(
        { userId: user.id },
        mediaExcerpt.id,
        [{ url: { url: "https://example.com" } }]
      );

      const foundQuotation = "the found quotation";
      const earliestFoundAt = utcNow();
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: earliestFoundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });
      const latestFoundAt = momentAdd(earliestFoundAt, { hours: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: latestFoundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });
      const earliestNotFoundAt = momentAdd(latestFoundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: earliestNotFoundAt,
        status: "NOT_FOUND",
        quotation,
      });
      const latestNotFoundAt = momentAdd(earliestNotFoundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: latestNotFoundAt,
        status: "NOT_FOUND",
        quotation,
      });

      // Act
      const status = await dao.readConfirmationStatusForUrlLocatorId(
        urlLocator.id
      );

      // Assert
      expect(status).toEqual(
        expectToBeSameMomentDeep({
          status: "PREVIOUSLY_FOUND",
          earliestFoundAt,
          latestFoundAt,
          foundQuotation,
          earliestNotFoundAt,
          latestNotFoundAt,
        })
      );
    });
    test("returns PREVIOUSLY_FOUND if it was found once before and not found once recently", async () => {
      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const createdAt = utcNow();
      const quotation = "the stored quotation";
      const { mediaExcerpt } = await mediaExcerptsDao.readOrCreateMediaExcerpt(
        { localRep: { quotation } },
        userId,
        createdAt,
        /* createUrlLocators= */ [],
        /* createCitations= */ []
      );
      const url = "https://example.com";
      const {
        urlLocators: [urlLocator],
      } = await mediaExcerptsService.createUrlLocators(
        { userId: user.id },
        mediaExcerpt.id,
        [{ url: { url: "https://example.com" } }]
      );

      const foundQuotation = "the found quotation";
      const foundAt = utcNow();
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: foundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });
      const notFoundAt = momentAdd(foundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: notFoundAt,
        status: "NOT_FOUND",
        quotation,
      });

      // Act
      const status = await dao.readConfirmationStatusForUrlLocatorId(
        urlLocator.id
      );

      // Assert
      expect(status).toEqual(
        expectToBeSameMomentDeep({
          status: "PREVIOUSLY_FOUND",
          earliestFoundAt: foundAt,
          latestFoundAt: foundAt,
          foundQuotation,
          earliestNotFoundAt: notFoundAt,
          latestNotFoundAt: notFoundAt,
        })
      );
    });
    test("returns PREVIOUSLY_FOUND if it was found, not found, found again, and not found again", async () => {
      // This tests the earliest_found_after_not_found case

      const { user } = await testHelper.makeUser();
      const { id: userId } = user;
      const createdAt = utcNow();
      const quotation = "the stored quotation";
      const { mediaExcerpt } = await mediaExcerptsDao.readOrCreateMediaExcerpt(
        { localRep: { quotation } },
        userId,
        createdAt,
        /* createUrlLocators= */ [],
        /* createCitations= */ []
      );
      const url = "https://example.com";
      const {
        urlLocators: [urlLocator],
      } = await mediaExcerptsService.createUrlLocators(
        { userId: user.id },
        mediaExcerpt.id,
        [{ url: { url: "https://example.com" } }]
      );

      const foundQuotation = "the found quotation";

      const firstFoundAt = utcNow();
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: firstFoundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });
      const firstNotFoundAt = momentAdd(firstFoundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: firstNotFoundAt,
        status: "NOT_FOUND",
        quotation,
      });

      const earliestFoundAt = momentAdd(firstNotFoundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: earliestFoundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });
      const latestFoundAt = momentAdd(earliestFoundAt, { hours: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: latestFoundAt,
        status: "FOUND",
        quotation,
        foundQuotation,
      });
      const earliestNotFoundAt = momentAdd(latestFoundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: earliestNotFoundAt,
        status: "NOT_FOUND",
        quotation,
      });
      const latestNotFoundAt = momentAdd(earliestNotFoundAt, { hour: 1 });
      await dao.create({
        urlLocatorId: urlLocator.id,
        url,
        completeAt: latestNotFoundAt,
        status: "NOT_FOUND",
        quotation,
      });

      // Act
      const status = await dao.readConfirmationStatusForUrlLocatorId(
        urlLocator.id
      );

      // Assert
      expect(status).toEqual(
        expectToBeSameMomentDeep({
          status: "PREVIOUSLY_FOUND",
          earliestFoundAt,
          latestFoundAt,
          foundQuotation,
          earliestNotFoundAt,
          latestNotFoundAt,
        })
      );
    });
  });
});
