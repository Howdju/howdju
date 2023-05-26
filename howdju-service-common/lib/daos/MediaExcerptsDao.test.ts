import { Pool } from "pg";
import { merge } from "lodash";

import {
  CreateDomAnchor,
  CreateMediaExcerptCitation,
  CreateUrlLocator,
  MomentConstructor,
  utcNow,
} from "howdju-common";
import { expectToBeSameMomentDeep, mockLogger } from "howdju-test-common";

import { endPoolAndDropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import { Database, makePool } from "../database";
import { MediaExcerptsDao } from "../daos";
import { makeTestProvider } from "@/initializers/TestProvider";
import TestHelper from "@/initializers/TestHelper";

const dbConfig = makeTestDbConfig();

describe("MediaExcerptsDao", () => {
  let dbName: string;
  let pool: Pool;

  let dao: MediaExcerptsDao;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    const database = new Database(mockLogger, pool);

    const provider = makeTestProvider(database);

    dao = provider.mediaExcerptsDao;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(pool, dbConfig, dbName);
  });

  describe("readMediaExcerptForId", () => {
    test("reads a media excerpt for an ID", async () => {
      const { authToken, user } = await testHelper.makeUser();
      const mediaExcerpt = await testHelper.makeMediaExcerpt(authToken, {
        quotation: "the text quote",
        urlLocators: [
          {
            url: {
              url: "https://www.example.com",
            },
            anchors: [
              {
                exactText: "exact text",
                prefixText: "prefix text",
                suffixText: "suffix text",
                startOffset: 0,
                endOffset: 1,
              },
            ],
          },
        ],
        citations: [
          {
            source: {
              descriptionApa: "the APA description",
            },
            pincite: "the pincite",
          },
        ],
        speakers: [{ name: "the speaker", isOrganization: false }],
      });

      const readMediaExcerpt = await dao.readMediaExcerptForId(mediaExcerpt.id);

      expect(readMediaExcerpt).toEqual(
        expectToBeSameMomentDeep(
          merge({}, mediaExcerpt, {
            localRep: {
              normalQuotation: "the text quote",
            },
            locators: {
              urlLocators: [
                {
                  url: {
                    creatorUserId: user.id,
                    created: expect.any(MomentConstructor),
                  },
                  creatorUserId: user.id,
                  created: expect.any(MomentConstructor),
                },
              ],
            },
            citations: [
              {
                source: {
                  id: expect.any(String),
                  normalDescriptionApa: "the apa description",
                  creatorUserId: user.id,
                  created: expect.any(MomentConstructor),
                },
                normalPincite: "the pincite",
                creatorUserId: user.id,
                created: expect.any(MomentConstructor),
              },
            ],
            speakers: [
              {
                id: expect.any(String),
                creator: { id: user.id },
                created: expect.any(MomentConstructor),
              },
            ],
          })
        )
      );
    });
    test("doesn't read a missing ID", async () => {
      const { authToken } = await testHelper.makeUser();
      await testHelper.makeMediaExcerpt(authToken, {
        quotation: "the text quote",
      });

      const readMediaExcerpt = await dao.readMediaExcerptForId("2");

      expect(readMediaExcerpt).toBeUndefined();
    });
    test.todo("doesn't read a deleted media excerpt");
    test.todo(
      "doesn't allow creating multiple media excerpts for the same local rep."
    );
    test.todo("allows recreating a deleted media excerpt");
  });

  describe("readEquivalentMediaExcerpt", () => {
    test("reads an equivalent media excerpt", async () => {
      const { authToken } = await testHelper.makeUser();
      const quotation = "the text quote";
      const mediaExcerpt = await testHelper.makeMediaExcerpt(authToken, {
        quotation,
        urlLocators: [],
      });

      const readMediaExcerpt = await dao.readEquivalentMediaExcerpt({
        localRep: { quotation },
      });

      expect(readMediaExcerpt?.id).toEqual(mediaExcerpt.id);
    });
  });

  describe("readEquivalentUrlLocator", () => {
    test("returns an equivalent UrlLocator", async () => {
      const { authToken, user: creator } = await testHelper.makeUser();
      const mediaExcerpt = await testHelper.makeMediaExcerpt(authToken, {
        quotation: "the text quote",
      });
      const url = await testHelper.makeUrl({ userId: authToken.userId });
      const createUrlLocator: CreateUrlLocator = {
        url,
        anchors: [
          {
            exactText: "exact text",
            prefixText: "prefix text",
            suffixText: "suffix text",
            startOffset: 0,
            endOffset: 1,
          },
        ],
      };
      const urlLocator = await dao.createUrlLocator(
        creator.id,
        mediaExcerpt,
        createUrlLocator,
        utcNow()
      );

      // Act
      const readUrlLocator = await dao.readEquivalentUrlLocator(
        mediaExcerpt,
        createUrlLocator
      );

      // Assert
      expect(readUrlLocator).toEqual(expectToBeSameMomentDeep(urlLocator));
    });

    test("doesn't return a UrlLocator with a superset of DomAnchors", async () => {
      const { authToken, user: creator } = await testHelper.makeUser();
      const mediaExcerpt = await testHelper.makeMediaExcerpt(authToken, {
        quotation: "the text quote",
      });
      const url = await testHelper.makeUrl({ userId: authToken.userId });
      const createUrlLocator: CreateUrlLocator = {
        url,
        anchors: [
          {
            exactText: "exact text 1",
            prefixText: "prefix text 1",
            suffixText: "suffix text 1",
            startOffset: 0,
            endOffset: 1,
          },
          {
            exactText: "exact text 2",
            prefixText: "prefix text 2",
            suffixText: "suffix text 2",
            startOffset: 2,
            endOffset: 3,
          },
        ],
      };
      await dao.createUrlLocator(
        creator.id,
        mediaExcerpt,
        createUrlLocator,
        utcNow()
      );
      const subsetUrlLocator: CreateUrlLocator = {
        url,
        anchors: [
          {
            exactText: "exact text 1",
            prefixText: "prefix text 1",
            suffixText: "suffix text 1",
            startOffset: 0,
            endOffset: 1,
          },
        ],
      };

      // Act
      const readUrlLocator = await dao.readEquivalentUrlLocator(
        mediaExcerpt,
        subsetUrlLocator
      );

      // Assert
      expect(readUrlLocator).toBeUndefined();
    });

    test("returns nothing for when URL locator has no anchors", async () => {
      const { authToken } = await testHelper.makeUser();
      const urlLocator = {
        url: {
          url: "https://www.example.com",
        },
        anchors: [
          {
            exactText: "exact text",
            prefixText: "prefix text",
            suffixText: "suffix text",
            startOffset: 0,
            endOffset: 1,
          },
        ],
      };
      const mediaExcerpt = await testHelper.makeMediaExcerpt(authToken, {
        quotation: "the text quote",
        urlLocators: [urlLocator],
      });

      expect(
        await dao.readEquivalentUrlLocator(mediaExcerpt, {
          ...urlLocator,
          anchors: undefined,
        })
      ).toBeUndefined();
    });
  });

  describe("createMediaExcerpt", () => {
    test("creates a media excerpt", async () => {
      const { user: creator } = await testHelper.makeUser();

      const createMediaExcerpt = {
        localRep: {
          quotation: "The  text  Quote.",
        },
      };
      const creatorUserId = creator.id;
      const created = utcNow();
      const mediaExcerpt = await dao.createMediaExcerpt(
        createMediaExcerpt,
        creatorUserId,
        created
      );

      expect(mediaExcerpt).toEqual(
        merge({}, createMediaExcerpt, {
          id: expect.any(String),
          localRep: {
            normalQuotation: "the text quote",
          },
          created,
          creatorUserId,
        })
      );
    });
  });

  describe("createUrlAnchor", () => {
    test("creates a UrlAnchor", async () => {
      const { authToken, user: creator } = await testHelper.makeUser();
      const mediaExcerpt = await testHelper.makeMediaExcerpt(authToken, {
        quotation: "the text quote",
      });
      const url = await testHelper.makeUrl({ userId: creator.id });
      const createDomAnchor: CreateDomAnchor = {
        exactText: "exact text",
        prefixText: "prefix text",
        suffixText: "suffix text",
        startOffset: 0,
        endOffset: 1,
      };
      const createUrlLocator: CreateUrlLocator = {
        url,
        anchors: [createDomAnchor],
      };
      const created = utcNow();

      const urlLocator = await dao.createUrlLocator(
        creator.id,
        mediaExcerpt,
        createUrlLocator,
        created
      );

      expect(urlLocator).toEqual(
        merge({}, createUrlLocator, {
          id: expect.any(String),
          creatorUserId: creator.id,
          created,
          anchors: [
            {
              urlLocatorId: urlLocator.id,
              creatorUserId: creator.id,
              created,
            },
          ],
        })
      );
    });
  });

  describe("createMediaExcerptCitation", () => {
    test("creates a media excerpt citation", async () => {
      const { authToken, user: creator } = await testHelper.makeUser();
      const mediaExcerpt = await testHelper.makeMediaExcerpt(authToken, {
        quotation: "the text quote",
      });
      const source = await testHelper.makeSource(creator.id, {
        descriptionApa: "the APA description",
      });
      const createCitation: CreateMediaExcerptCitation = {
        source,
        pincite: "The  pincite!",
      };
      const created = utcNow();
      const citation = await dao.createMediaExcerptCitation(
        creator.id,
        mediaExcerpt,
        createCitation,
        created
      );

      expect(citation).toEqual(
        merge({}, createCitation, {
          mediaExcerptId: mediaExcerpt.id,
          created,
          creatorUserId: creator.id,
          normalPincite: "the pincite",
        })
      );
    });
  });

  describe("readEquivalentMediaExcerptCitation", () => {
    test("reads an equivalent media excerpt citation when pincites are not identical", async () => {
      const { authToken, user: creator } = await testHelper.makeUser();
      const mediaExcerpt = await testHelper.makeMediaExcerpt(authToken, {
        quotation: "the text quote",
      });
      const source = await testHelper.makeSource(creator.id, {
        descriptionApa: "the APA description",
      });
      const createCitation: CreateMediaExcerptCitation = {
        source,
        pincite: "the pincite",
      };
      const created = utcNow();
      const citation = await dao.createMediaExcerptCitation(
        creator.id,
        mediaExcerpt,
        createCitation,
        created
      );

      const readCitation = await dao.readEquivalentMediaExcerptCitation(
        mediaExcerpt,
        {
          ...citation,
          pincite: "The  Pincite...",
        }
      );

      expect(readCitation).toEqual(expectToBeSameMomentDeep(citation));
    });
  });
});
