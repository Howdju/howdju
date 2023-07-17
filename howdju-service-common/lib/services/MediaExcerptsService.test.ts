import { Pool } from "pg";
import { merge, toNumber } from "lodash";

import {
  CreateMediaExcerpt,
  MediaExcerptSearchFilter,
  MomentConstructor,
  sleep,
  SortDescription,
} from "howdju-common";
import { expectToBeSameMomentDeep, mockLogger } from "howdju-test-common";

import { endPoolAndDropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import { Database, makePool } from "../database";
import { makeTestProvider } from "@/initializers/TestProvider";
import TestHelper from "@/initializers/TestHelper";
import { MediaExcerptsService } from "./MediaExcerptsService";

const dbConfig = makeTestDbConfig();

describe("MediaExcerptsService", () => {
  let dbName: string;
  let pool: Pool;

  let service: MediaExcerptsService;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    const database = new Database(mockLogger, pool);

    const provider = makeTestProvider(database);

    service = provider.mediaExcerptsService;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(pool, dbConfig, dbName);
  });

  describe("readOrCreateMediaExcerpt", () => {
    test("creates a media excerpt", async () => {
      const { authToken, user } = await testHelper.makeUser();
      const url = { url: "https://www.example.com" };
      const createMediaExcerpt: CreateMediaExcerpt = {
        localRep: {
          quotation: "the text quote",
        },
        locators: {
          urlLocators: [
            {
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
            },
          ],
        },
        citations: [
          {
            source: {
              description: "the source description",
            },
            pincite: "the pincite",
          },
        ],
        speakers: [{ name: "the speaker", isOrganization: false }],
      };

      const { isExtant, mediaExcerpt } = await service.readOrCreateMediaExcerpt(
        { authToken },
        createMediaExcerpt
      );

      const creatorInfo = {
        creatorUserId: user.id,
        created: expect.any(MomentConstructor),
      };
      expect(isExtant).toBe(false);
      expect(mediaExcerpt).toEqual(
        expectToBeSameMomentDeep(
          merge({}, createMediaExcerpt, {
            id: expect.any(String),
            localRep: {
              normalQuotation: "the text quote",
            },
            locators: {
              urlLocators: [
                {
                  id: expect.any(String),
                  url: {
                    id: expect.any(String),
                    canonicalUrl: url.url,
                    ...creatorInfo,
                  },
                  anchors: [
                    {
                      urlLocatorId: mediaExcerpt.locators.urlLocators[0].id,
                      ...creatorInfo,
                    },
                  ],
                  ...creatorInfo,
                },
              ],
            },
            citations: [
              {
                mediaExcerptId: mediaExcerpt.id,
                source: {
                  id: expect.any(String),
                  normalDescription: "the source description",
                  ...creatorInfo,
                  creator: { id: user.id, longName: user.longName },
                },
                normalPincite: "the pincite",
                ...creatorInfo,
              },
            ],
            speakers: [
              {
                id: expect.any(String),
                creator: { id: user.id },
                created: expect.any(MomentConstructor),
                creatorUserId: user.id,
                normalName: "the speaker",
              },
            ],
            ...creatorInfo,
          })
        )
      );
    });
    test("re-uses related entities.", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();
      const createMediaExcerpt: CreateMediaExcerpt = {
        localRep: {
          quotation: "the text quote",
        },
        locators: {
          urlLocators: [
            {
              url: { url: "https://www.example.com" },
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
        },
        citations: [
          {
            source: { description: "the source description" },
            pincite: "the pincite",
          },
          { source: { description: "the source description" } },
        ],
        speakers: [{ name: "the speaker", isOrganization: false }],
      };
      const { mediaExcerpt: firstMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          createMediaExcerpt
        );

      // Act
      const { isExtant, mediaExcerpt } = await service.readOrCreateMediaExcerpt(
        { authToken },
        createMediaExcerpt
      );

      // Assert
      expect(mediaExcerpt).toEqual(expectToBeSameMomentDeep(firstMediaExcerpt));
      expect(isExtant).toBe(true);
    });
    test("reads the media excerpt when Sources overlap and there are new locators", async () => {
      const { authToken } = await testHelper.makeUser();
      const createMediaExcerpt: CreateMediaExcerpt = {
        localRep: {
          quotation: "the text quote",
        },
        locators: {
          urlLocators: [{ url: { url: "https://www.example.com" } }],
        },
        citations: [{ source: { description: "the source description" } }],
        speakers: [{ name: "the speaker", isOrganization: false }],
      };
      const { mediaExcerpt: firstMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          createMediaExcerpt
        );

      // Act
      const { isExtant, mediaExcerpt: nextMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          {
            ...createMediaExcerpt,
            locators: {
              urlLocators: [{ url: { url: "https://www.example-2.com" } }],
            },
          }
        );

      // Assert
      const readMediaExcerpt = await service.readMediaExcerptForId(
        firstMediaExcerpt.id
      );
      expect(nextMediaExcerpt).toEqual(
        expectToBeSameMomentDeep(readMediaExcerpt)
      );
      expect(isExtant).toBe(false);
    });
    test("reads the media excerpt when Sources overlap and there is a new locator", async () => {
      const { authToken } = await testHelper.makeUser();
      const createMediaExcerpt: CreateMediaExcerpt = {
        localRep: {
          quotation: "the text quote",
        },
        citations: [{ source: { description: "the source description" } }],
        speakers: [{ name: "the speaker", isOrganization: false }],
      };
      const { mediaExcerpt: firstMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          createMediaExcerpt
        );

      // Act
      const { isExtant, mediaExcerpt: nextMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          {
            ...createMediaExcerpt,
            locators: {
              urlLocators: [{ url: { url: "https://www.example-2.com" } }],
            },
          }
        );

      // Assert
      const readMediaExcerpt = await service.readMediaExcerptForId(
        firstMediaExcerpt.id
      );
      expect(nextMediaExcerpt).toEqual(
        expectToBeSameMomentDeep(readMediaExcerpt)
      );
      expect(isExtant).toBe(false);
    });
    test("reads the media excerpt when Sources overlap and locators are missing", async () => {
      const { authToken } = await testHelper.makeUser();
      const createMediaExcerpt: CreateMediaExcerpt = {
        localRep: {
          quotation: "the text quote",
        },
        locators: {
          urlLocators: [{ url: { url: "https://www.example.com" } }],
        },
        citations: [{ source: { description: "the source description" } }],
        speakers: [{ name: "the speaker", isOrganization: false }],
      };
      const { mediaExcerpt: firstMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          createMediaExcerpt
        );

      // Act
      const { isExtant, mediaExcerpt: nextMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          { ...createMediaExcerpt, locators: undefined }
        );

      // Assert
      expect(nextMediaExcerpt).toEqual(
        expectToBeSameMomentDeep(firstMediaExcerpt)
      );
      expect(isExtant).toBe(true);
    });
    test("reads the media excerpt when URLs overlap and there are new Sources", async () => {
      const { authToken } = await testHelper.makeUser();
      const createMediaExcerpt: CreateMediaExcerpt = {
        localRep: {
          quotation: "the text quote",
        },
        locators: {
          urlLocators: [{ url: { url: "https://www.example.com" } }],
        },
        citations: [{ source: { description: "the source description" } }],
        speakers: [{ name: "the speaker", isOrganization: false }],
      };
      const { mediaExcerpt: firstMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          createMediaExcerpt
        );

      // Act
      const { isExtant, mediaExcerpt: nextMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          {
            ...createMediaExcerpt,
            citations: [
              { source: { description: "the source description 2" } },
            ],
          }
        );

      // Assert
      const readMediaExcerpt = await service.readMediaExcerptForId(
        firstMediaExcerpt.id
      );
      expect(nextMediaExcerpt).toEqual(
        expectToBeSameMomentDeep(readMediaExcerpt)
      );
      expect(isExtant).toBe(false);
    });
    test("reads the media excerpt when URLs overlap and Sources are missing", async () => {
      const { authToken } = await testHelper.makeUser();
      const createMediaExcerpt: CreateMediaExcerpt = {
        localRep: {
          quotation: "the text quote",
        },
        locators: {
          urlLocators: [{ url: { url: "https://www.example.com" } }],
        },
        citations: [{ source: { description: "the source description" } }],
        speakers: [{ name: "the speaker", isOrganization: false }],
      };
      const { mediaExcerpt: firstMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          createMediaExcerpt
        );

      // Act
      const { isExtant, mediaExcerpt: nextMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          { ...createMediaExcerpt, citations: undefined }
        );

      // Assert
      expect(nextMediaExcerpt).toEqual(
        expectToBeSameMomentDeep(firstMediaExcerpt)
      );
      expect(isExtant).toBe(true);
    });
    test("creates a new media excerpt when neither Citations nor Sources overlap", async () => {
      const { authToken } = await testHelper.makeUser();
      const createMediaExcerpt: CreateMediaExcerpt = {
        localRep: {
          quotation: "the text quote",
        },
        locators: {
          urlLocators: [{ url: { url: "https://www.website-1.com" } }],
        },
        citations: [{ source: { description: "the source description" } }],
        speakers: [{ name: "the speaker", isOrganization: false }],
      };
      const { mediaExcerpt: firstMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          createMediaExcerpt
        );

      const nextCreateMediaExcerpt = {
        ...createMediaExcerpt,
        locators: {
          urlLocators: [{ url: { url: "https://www.website-2.com" } }],
        },
        citations: [
          { source: { description: "a different source description" } },
        ],
      };

      // Act
      const { isExtant, mediaExcerpt: nextMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          nextCreateMediaExcerpt
        );

      // Assert
      expect(nextMediaExcerpt).not.toEqual(
        expectToBeSameMomentDeep(firstMediaExcerpt)
      );
      expect(isExtant).toBe(false);
    });
    test("re-uses related entities for concurrent attempts", async () => {
      // Arrange
      const count = 10;
      const users = await Promise.all(
        Array.from({ length: count }).map((_, i) =>
          testHelper.makeUser({
            username: `user${i}`,
            email: `user${i}@domain.org`,
          })
        )
      );
      const createMediaExcerpt: CreateMediaExcerpt = {
        localRep: {
          quotation: "the text quote",
        },
        locators: {
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
        },
        citations: [
          {
            source: { description: "the source description" },
            pincite: "the pincite",
          },
          {
            source: { description: "the source description" },
          },
        ],
        speakers: [{ name: "the speaker", isOrganization: false }],
      };

      // Act
      const mediaExcerptResults = await Promise.all(
        Array.from({ length: count }).map((_, i) =>
          service.readOrCreateMediaExcerpt(
            { authToken: users[i].authToken },
            createMediaExcerpt
          )
        )
      );

      // Assert
      const mediaExcerpt = mediaExcerptResults[0].mediaExcerpt;
      for (const mediaExcerptResult of mediaExcerptResults) {
        expect(mediaExcerptResult.mediaExcerpt).toEqual(
          expectToBeSameMomentDeep(mediaExcerpt)
        );
      }
    });
    test("re-uses related entities for concurrent additions of UrlLocators", async () => {
      // Arrange
      const count = 5;
      const { authToken } = await testHelper.makeUser();
      const createMediaExcerpt: CreateMediaExcerpt = {
        localRep: {
          quotation: "the text quote",
        },
        citations: [
          {
            source: { description: "the source description" },
          },
        ],
      };
      const { mediaExcerpt: originalMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          createMediaExcerpt
        );

      // Act

      // Since these all share a citation with the previously created media excerpt,
      // they will read the media excerpt and then attempt to add relations between
      // it and the new URL. Some of them will double-write due to the
      // lack of transactional isolation, and readMediaExcerpt will have more than
      // one identical UrlLocator.
      const mediaExcerptResults = await Promise.all(
        Array.from({ length: count }).map(() =>
          service.readOrCreateMediaExcerpt(
            { authToken },
            {
              ...createMediaExcerpt,
              locators: {
                urlLocators: [{ url: { url: "http://www.website.com" } }],
              },
            }
          )
        )
      );

      // Assert
      const readMediaExcerpt = await service.readMediaExcerptForId(
        originalMediaExcerpt.id
      );
      for (const { mediaExcerpt } of mediaExcerptResults) {
        expect(mediaExcerpt).toEqual(
          expectToBeSameMomentDeep(readMediaExcerpt)
        );
      }
    });
    test("re-uses related entities for concurrent additions of Citations", async () => {
      // Arrange
      const count = 5;
      const { authToken } = await testHelper.makeUser();
      const createMediaExcerpt: CreateMediaExcerpt = {
        localRep: {
          quotation: "the text quote",
        },
        locators: { urlLocators: [{ url: { url: "http://www.website.com" } }] },
      };
      const { mediaExcerpt: originalMediaExcerpt } =
        await service.readOrCreateMediaExcerpt(
          { authToken },
          createMediaExcerpt
        );

      // Act

      // Since these all share a URL with the previously created media excerpt,
      // they will read the media excerpt and then attempt to add relations between
      // it and the new Source. Some of them will double-write due to the
      // lack of transactional isolation, and readMediaExcerpt will have more than
      // one identical Source.
      const mediaExcerptResults = await Promise.all(
        Array.from({ length: count }).map(() =>
          service.readOrCreateMediaExcerpt(
            { authToken },
            {
              ...createMediaExcerpt,
              citations: [
                { source: { description: "the source description" } },
              ],
            }
          )
        )
      );

      // Assert
      const readMediaExcerpt = await service.readMediaExcerptForId(
        originalMediaExcerpt.id
      );
      for (const { mediaExcerpt } of mediaExcerptResults) {
        expect(mediaExcerpt).toEqual(
          expectToBeSameMomentDeep(readMediaExcerpt)
        );
      }
    });
  });

  describe("readMediaExcerptForId", () => {
    test("reads a media excerpt.", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();
      const mediaExcerpt = await testHelper.makeMediaExcerpt({ authToken });

      // Act
      const readMediaExcerpt = await service.readMediaExcerptForId(
        mediaExcerpt.id
      );

      // Assert
      expect(readMediaExcerpt).toEqual(expectToBeSameMomentDeep(mediaExcerpt));
    });
  });

  describe("readMediaExcerpts", () => {
    test("reads initial filtered MediaExcerpts", async () => {
      const { authToken, user } = await testHelper.makeUser();
      const speaker1 = await testHelper.makePersorg(user.id, {
        name: "Name 1",
      });
      const speaker2 = await testHelper.makePersorg(user.id, {
        name: "Name 2",
      });
      const mediaExcerpts = await Promise.all(
        Array.from({ length: 10 }).map(async (_, i) => {
          await sleep(Math.random() * 1000);
          return await testHelper.makeMediaExcerpt(
            { authToken },
            {
              localRep: {
                // Make quotaiton unique to avoid any equivalence.
                quotation: `The most magical thing ${i}`,
              },
              speakers: [i % 2 == 0 ? speaker1 : speaker2],
            }
          );
        })
      );
      // Media excerpts are created out of ID order above, but will be returned sorted by ID
      const filters: MediaExcerptSearchFilter = {
        speakerPersorgId: speaker1.id,
      };
      const sorts: SortDescription[] = [];
      const count = 3;
      const continuationToken = undefined;

      mediaExcerpts.sort((a, b) => toNumber(a.id) - toNumber(b.id));
      const expectedMediaExcerpts = mediaExcerpts
        .filter((me) => me.speakers[0].id === speaker1.id)
        .slice(0, count);

      // Act
      const { mediaExcerpts: mediaExcerptsOut } =
        await service.readMediaExcerpts(
          filters,
          sorts,
          continuationToken,
          count
        );

      // Assert
      expect(mediaExcerptsOut).toIncludeSameMembers(
        expectToBeSameMomentDeep(expectedMediaExcerpts)
      );
    });

    test("reads more filtered MediaExcerpts", async () => {
      const { authToken, user } = await testHelper.makeUser();
      const speaker1 = await testHelper.makePersorg(user.id, {
        name: "Name 1",
      });
      const speaker2 = await testHelper.makePersorg(user.id, {
        name: "Name 2",
      });
      const mediaExcerpts = await Promise.all(
        Array.from({ length: 10 }).map(async (_, i) => {
          await sleep(Math.random() * 1000);
          return await testHelper.makeMediaExcerpt(
            { authToken },
            {
              localRep: {
                // Make quotaiton unique to avoid any equivalence.
                quotation: `The most magical thing ${i}`,
              },
              speakers: [i % 2 == 0 ? speaker1 : speaker2],
            }
          );
        })
      );
      mediaExcerpts.sort((a, b) => toNumber(a.id) - toNumber(b.id));
      const filters: MediaExcerptSearchFilter = {
        speakerPersorgId: speaker1.id,
      };
      const sorts: SortDescription[] = [];
      const count = 3;

      const { continuationToken } = await service.readMediaExcerpts(
        filters,
        sorts,
        /*continuationToken=*/ undefined,
        count
      );

      // Media excerpts are created out of ID order above, but will be returned sorted by ID
      mediaExcerpts.sort((a, b) => toNumber(a.id) - toNumber(b.id));
      const expectedMediaExcerpts = mediaExcerpts
        .filter((me) => me.speakers[0].id === speaker1.id)
        .slice(count, 2 * count);

      // Act
      const { mediaExcerpts: mediaExcerptsOut } =
        await service.readMediaExcerpts(
          filters,
          sorts,
          continuationToken,
          count
        );

      // Assert
      expect(mediaExcerptsOut).toIncludeSameMembers(
        expectToBeSameMomentDeep(expectedMediaExcerpts)
      );
    });
  });
});
