import { Pool } from "pg";
import { merge } from "lodash";

import { CreateMediaExcerpt, MomentConstructor } from "howdju-common";
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
            source: {
              descriptionApa: "the APA description",
            },
            pincite: "the pincite",
          },
        ],
        speakers: [{ name: "the speaker", isOrganization: false }],
      };

      const { isExtant, mediaExcerpt } = await service.readOrCreateMediaExcerpt(
        authToken,
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
                  normalDescriptionApa: "the apa description",
                  ...creatorInfo,
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
            source: { descriptionApa: "the APA description" },
            pincite: "the pincite",
          },
          {
            source: { descriptionApa: "the APA description" },
          },
        ],
        speakers: [{ name: "the speaker", isOrganization: false }],
      };
      await service.readOrCreateMediaExcerpt(authToken, createMediaExcerpt);

      // Act
      const { isExtant, mediaExcerpt } = await service.readOrCreateMediaExcerpt(
        authToken,
        createMediaExcerpt
      );

      // Assert
      const readMediaExcerpt = await service.readMediaExcerptForId(
        mediaExcerpt.id
      );
      expect(readMediaExcerpt).toEqual(expectToBeSameMomentDeep(mediaExcerpt));
      expect(isExtant).toBe(true);
    });
  });

  describe("readMediaExcerptForId", () => {
    test("reads a media excerpt.", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();
      const mediaExcerpt = await testHelper.makeMediaExcerpt(authToken);

      // Act
      const readMediaExcerpt = await service.readMediaExcerptForId(
        mediaExcerpt.id
      );

      // Assert
      expect(readMediaExcerpt).toEqual(expectToBeSameMomentDeep(mediaExcerpt));
    });
  });
});
