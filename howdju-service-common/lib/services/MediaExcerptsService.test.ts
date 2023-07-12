import { Pool } from "pg";
import { merge, toNumber } from "lodash";

import {
  CreateMediaExcerpt,
  MediaExcerptSearchFilter,
  MomentConstructor,
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
      await service.readOrCreateMediaExcerpt({ authToken }, createMediaExcerpt);

      // Act
      const { isExtant, mediaExcerpt } = await service.readOrCreateMediaExcerpt(
        { authToken },
        createMediaExcerpt
      );

      // Assert
      const readMediaExcerpt = await service.readMediaExcerptForId(
        mediaExcerpt.id
      );
      expect(readMediaExcerpt).toEqual(expectToBeSameMomentDeep(mediaExcerpt));
      expect(isExtant).toBe(true);
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
        Array.from({ length: 10 }).map((_, i) =>
          testHelper.makeMediaExcerpt(
            { authToken },
            {
              localRep: {
                // Make quotaiton unique to avoid any equivalence.
                quotation: `The most magical thing ${i}`,
              },
              speakers: [i % 2 == 0 ? speaker1 : speaker2],
            }
          )
        )
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
        Array.from({ length: 10 }).map((_, i) =>
          testHelper.makeMediaExcerpt(
            { authToken },
            {
              localRep: {
                // Make quotaiton unique to avoid any equivalence.
                quotation: `The most magical thing ${i}`,
              },
              speakers: [i % 2 == 0 ? speaker1 : speaker2],
            }
          )
        )
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
