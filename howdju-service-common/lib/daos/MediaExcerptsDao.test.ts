import { Pool } from "pg";
import { merge, parseInt, toString } from "lodash";

import { CreateUrlLocator, MomentConstructor, utcNow } from "howdju-common";
import { expectToBeSameMomentDeep, mockLogger } from "howdju-test-common";

import { endPoolAndDropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import { Database, makePool } from "../database";
import { MediaExcerptsDao } from "../daos";
import { makeTestProvider } from "@/initializers/TestProvider";
import TestHelper from "@/initializers/TestHelper";
import { MediaExcerptsService } from "..";

const dbConfig = makeTestDbConfig();

describe("MediaExcerptsDao", () => {
  let dbName: string;
  let pool: Pool;
  let database: Database;

  let dao: MediaExcerptsDao;
  let mediaExcerptsService: MediaExcerptsService;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    database = new Database(mockLogger, pool);

    const provider = makeTestProvider(database);

    dao = provider.mediaExcerptsDao;
    mediaExcerptsService = provider.mediaExcerptsService;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(pool, dbConfig, dbName);
  });

  describe("readMediaExcerptForId", () => {
    test("reads a media excerpt for an ID", async () => {
      const { authToken, user } = await testHelper.makeUser();
      const mediaExcerpt = await testHelper.makeMediaExcerpt({ authToken });

      const readMediaExcerpt = await dao.readMediaExcerptForId(mediaExcerpt.id);

      const expectedSource = merge({}, mediaExcerpt.citations[0].source, {
        id: expect.any(String),
        normalDescription: "the source description",
        creatorUserId: user.id,
        created: expect.any(MomentConstructor),
      });
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
                source: expectedSource,
                normalPincite: "the pincite",
                creatorUserId: user.id,
                created: expect.any(MomentConstructor),
              },
              {
                source: expectedSource,
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
      const mediaExcerpt = await testHelper.makeMediaExcerpt({ authToken });

      const readMediaExcerpt = await dao.readMediaExcerptForId(
        // Try to get a nonexistent ID.
        toString(parseInt(mediaExcerpt.id) + 1)
      );

      expect(readMediaExcerpt).toBeUndefined();
    });
    test.todo("doesn't read a deleted media excerpt");
    test.todo("allows recreating a deleted media excerpt");
  });

  describe("readEquivalentUrlLocator", () => {
    test("returns an equivalent UrlLocator with an anchor", async () => {
      const { authToken, user: creator } = await testHelper.makeUser();
      const mediaExcerpt = await testHelper.makeMediaExcerpt(
        { authToken },
        {
          localRep: { quotation: "the text quote" },
        }
      );
      const url = await testHelper.makeUrl({ userId: creator.id });
      const createUrlLocator = {
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
      const urlLocator = await dao.createUrlLocator({
        creatorUserId: creator.id,
        mediaExcerpt,
        createUrlLocator,
        created: utcNow(),
      });

      // Act
      const readUrlLocator = await dao.readEquivalentUrlLocator({
        mediaExcerpt,
        createUrlLocator,
      });

      // Assert
      expect(readUrlLocator).toEqual(expectToBeSameMomentDeep(urlLocator));
    });

    test("returns an equivalent UrlLocator with no anchor", async () => {
      const { authToken, user: creator } = await testHelper.makeUser();
      const mediaExcerpt = await testHelper.makeMediaExcerpt(
        { authToken },
        {
          localRep: { quotation: "the text quote" },
        }
      );
      const url = await testHelper.makeUrl({ userId: creator.id });
      const createUrlLocator = { url };
      const urlLocator = await dao.createUrlLocator({
        creatorUserId: creator.id,
        mediaExcerpt,
        createUrlLocator,
        created: utcNow(),
      });

      // Act
      const readUrlLocator = await dao.readEquivalentUrlLocator({
        mediaExcerpt,
        createUrlLocator,
      });

      // Assert
      expect(readUrlLocator).toEqual(expectToBeSameMomentDeep(urlLocator));
    });

    test("doesn't return a UrlLocator with a superset of DomAnchors", async () => {
      const { authToken, user: creator } = await testHelper.makeUser();
      const mediaExcerpt = await testHelper.makeMediaExcerpt(
        { authToken },
        {
          localRep: { quotation: "the text quote" },
        }
      );
      const url = await testHelper.makeUrl({ userId: creator.id });
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
      await dao.createUrlLocator({
        creatorUserId: creator.id,
        mediaExcerpt,
        createUrlLocator,
        created: utcNow(),
      });
      const subsetUrlLocator = {
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
      const readUrlLocator = await dao.readEquivalentUrlLocator({
        mediaExcerpt,
        createUrlLocator: subsetUrlLocator,
      });

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
      const mediaExcerpt = await testHelper.makeMediaExcerpt(
        { authToken },
        {
          localRep: { quotation: "the text quote" },
          locators: { urlLocators: [urlLocator] },
        }
      );

      expect(
        await dao.readEquivalentUrlLocator({
          mediaExcerpt,
          createUrlLocator: {
            ...mediaExcerpt.locators.urlLocators[0],
            anchors: undefined,
          },
        })
      ).toBeUndefined();
    });
  });

  describe("readOrCreateMediaExcerpt", () => {
    test("creates a media excerpt", async () => {
      const { user: creator } = await testHelper.makeUser();
      const url = await testHelper.makeUrl({ userId: creator.id });
      const urlLocators = [{ url }];
      const source = await testHelper.makeSource(creator.id);
      const citations = [{ source }];

      const createMediaExcerpt = {
        localRep: {
          quotation: "The  text  Quote.",
        },
      };
      const creatorUserId = creator.id;
      const created = utcNow();
      const { mediaExcerpt, isExtant } = await dao.readOrCreateMediaExcerpt(
        createMediaExcerpt,
        creatorUserId,
        created,
        urlLocators,
        citations
      );

      expect(isExtant).toBe(false);
      expect(mediaExcerpt).toEqual(
        merge({}, createMediaExcerpt, {
          id: expect.any(String),
          localRep: {
            normalQuotation: "the text quote",
          },
          locators: { urlLocators: [expect.objectContaining(urlLocators[0])] },
          citations: [expect.objectContaining(citations[0])],
          created,
          creatorUserId,
        })
      );
    });
  });

  describe("readMediaExcerptsMatchingUrl", () => {
    test("reads media excerpts having the same origin and path", async () => {
      const { authToken } = await testHelper.makeUser();
      const localRep = {
        quotation: "I have no special talent. I am only passionately curious.",
      };
      const { mediaExcerpt } =
        await mediaExcerptsService.readOrCreateMediaExcerpt(
          { authToken },
          {
            localRep,
            locators: {
              urlLocators: [
                { url: { url: "https://www.example.com/the-path" } },
              ],
            },
            citations: [{ source: { description: "Just an example." } }],
          }
        );
      const { mediaExcerpt: subPathMediaExcerpt } =
        await mediaExcerptsService.readOrCreateMediaExcerpt(
          { authToken },
          {
            localRep,
            locators: {
              urlLocators: [{ url: { url: "https://www.example.com/the" } }],
            },
            citations: [{ source: { description: "Just an example 1." } }],
          }
        );
      const { mediaExcerpt: superPathMediaExcerpt } =
        await mediaExcerptsService.readOrCreateMediaExcerpt(
          { authToken },
          {
            localRep,
            locators: {
              urlLocators: [
                {
                  url: {
                    url: "https://www.example.com/the-path-goes-ever-on-and-on",
                  },
                },
              ],
            },
            citations: [{ source: { description: "Just an example 2." } }],
          }
        );
      const { mediaExcerpt: samePathWithQueryFragmentMediaExcerpt } =
        await mediaExcerptsService.readOrCreateMediaExcerpt(
          { authToken },
          {
            localRep,
            locators: {
              urlLocators: [
                {
                  url: {
                    url: "https://www.example.com/the-path?key=value#the-fragment",
                  },
                },
              ],
            },
            citations: [{ source: { description: "Just an example 3." } }],
          }
        );
      const { mediaExcerpt: samePathWithSlashMediaFragment } =
        await mediaExcerptsService.readOrCreateMediaExcerpt(
          { authToken },
          {
            localRep,
            locators: {
              urlLocators: [
                { url: { url: "https://www.example.com/the-path/" } },
              ],
            },
            citations: [{ source: { description: "Just an example 4." } }],
          }
        );
      const { mediaExcerpt: differentProtocolMediaExcerpt } =
        await mediaExcerptsService.readOrCreateMediaExcerpt(
          { authToken },
          {
            localRep,
            locators: {
              urlLocators: [{ url: { url: "http://www.example.com/" } }],
            },
            citations: [{ source: { description: "Just an example 5." } }],
          }
        );
      const { mediaExcerpt: differentTldMediaExcerpt } =
        await mediaExcerptsService.readOrCreateMediaExcerpt(
          { authToken },
          {
            localRep,
            locators: {
              urlLocators: [{ url: { url: "https://www.example.org/" } }],
            },
            citations: [{ source: { description: "Just an example 6." } }],
          }
        );
      const { mediaExcerpt: differentPathMediaExcerpt } =
        await mediaExcerptsService.readOrCreateMediaExcerpt(
          { authToken },
          {
            localRep,
            locators: {
              urlLocators: [
                { url: { url: "https://www.example.com/other-path" } },
              ],
            },
            citations: [{ source: { description: "Just an example 7." } }],
          }
        );

      // Act
      const readMediaExcerpts = await dao.readMediaExcerptsMatchingUrl(
        "https://www.example.com/the-path?otherKey=otherValue#other-fragment"
      );

      // Assert

      // Ensure they weren't equivalent.
      expect(mediaExcerpt.id).not.toBeOneOf([
        subPathMediaExcerpt.id,
        superPathMediaExcerpt.id,
        samePathWithQueryFragmentMediaExcerpt.id,
        samePathWithSlashMediaFragment.id,
        differentProtocolMediaExcerpt.id,
        differentTldMediaExcerpt.id,
        differentPathMediaExcerpt.id,
      ]);
      expect(readMediaExcerpts).toIncludeSameMembers(
        expectToBeSameMomentDeep([
          mediaExcerpt,
          samePathWithSlashMediaFragment,
          samePathWithQueryFragmentMediaExcerpt,
        ])
      );
    });
  });

  describe("readMediaExcerptsMatchingDomain", () => {
    test("reads media excerpts having the same domain or that are a subdomain.", async () => {
      const { authToken } = await testHelper.makeUser();
      const localRep = {
        quotation: "I have no special talent. I am only passionately curious.",
      };
      const { mediaExcerpt: sameDomainMediaExcerpt } =
        await mediaExcerptsService.readOrCreateMediaExcerpt(
          { authToken },
          {
            localRep,
            locators: {
              urlLocators: [
                { url: { url: "https://www.example.com/the-path" } },
              ],
            },
            citations: [{ source: { description: "Just an example 1." } }],
          }
        );
      const { mediaExcerpt: differentPathMediaExcerpt } =
        await mediaExcerptsService.readOrCreateMediaExcerpt(
          { authToken },
          {
            localRep,
            locators: {
              urlLocators: [
                { url: { url: "https://www.example.com/different-path" } },
              ],
            },
            citations: [{ source: { description: "Just an example 2." } }],
          }
        );
      const { mediaExcerpt: subDomainMediaExcerpt } =
        await mediaExcerptsService.readOrCreateMediaExcerpt(
          { authToken },
          {
            localRep,
            locators: {
              urlLocators: [{ url: { url: "http://sub.www.example.com/" } }],
            },
            citations: [{ source: { description: "Just an example 3." } }],
          }
        );
      const { mediaExcerpt: parentDomainMediaExcerpt } =
        await mediaExcerptsService.readOrCreateMediaExcerpt(
          { authToken },
          {
            localRep,
            locators: {
              urlLocators: [{ url: { url: "https://example.com/" } }],
            },
            citations: [{ source: { description: "Just an example 4." } }],
          }
        );

      // Act
      const readMediaExcerpts = await dao.readMediaExcerptsMatchingDomain(
        "www.example.com"
      );

      // Assert

      // Ensure they weren't equivalent.
      expect(sameDomainMediaExcerpt.id).not.toBeOneOf([
        differentPathMediaExcerpt.id,
        subDomainMediaExcerpt.id,
        parentDomainMediaExcerpt.id,
      ]);
      expect(readMediaExcerpts).toIncludeSameMembers(
        expectToBeSameMomentDeep([
          sameDomainMediaExcerpt,
          differentPathMediaExcerpt,
          subDomainMediaExcerpt,
        ])
      );
    });
  });
});
