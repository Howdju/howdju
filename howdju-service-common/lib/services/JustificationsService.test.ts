import moment from "moment";
import { filter, merge } from "lodash";

import {
  CreateCounterJustification,
  CreateJustification,
  JustificationOut,
  JustificationSearchFilters,
  negateRootPolarity,
  SortDescription,
} from "howdju-common";
import { mockLogger, expectToBeSameMomentDeep } from "howdju-test-common";

import {
  endPoolAndDropDb,
  initDb,
  makeTestClientProvider,
  makeTestDbConfig,
} from "@/util/testUtil";
import {
  Database,
  EntityNotFoundError,
  EntityValidationError,
  JustificationsService,
  PoolClientProvider,
  PropositionCompoundsService,
  UnauthenticatedError,
  WritQuotesService,
} from "..";
import { makeTestProvider } from "@/initializers/TestProvider";
import TestHelper from "@/initializers/TestHelper";

const dbConfig = makeTestDbConfig();

describe("JustificationsService", () => {
  let dbName: string;
  let clientProvider: PoolClientProvider;

  let service: JustificationsService;
  let propositionCompoundsService: PropositionCompoundsService;
  let writQuotesService: WritQuotesService;
  let testHelper: TestHelper;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    clientProvider = makeTestClientProvider({
      ...dbConfig,
      database: dbName,
    });
    const database = new Database(mockLogger, clientProvider);

    const provider = makeTestProvider(database);

    service = provider.justificationsService;
    propositionCompoundsService = provider.propositionCompoundsService;
    writQuotesService = provider.writQuotesService;
    testHelper = provider.testHelper;
  });
  afterEach(async () => {
    await endPoolAndDropDb(clientProvider, dbConfig, dbName);
  });
  describe("readOrCreate", () => {
    test("can create a proposition compound based justification targeting a proposition", async () => {
      // Arrange
      const { authToken, user } = await testHelper.makeUser();

      const createJustification = makePropositionCompoundBasedJustification();

      // Act
      const { isExtant, justification: justificationOut } =
        await service.readOrCreate(createJustification, authToken);

      // Assert
      expect(isExtant).toBe(false);
      expect(justificationOut).toMatchObject({
        ...createJustification,
        id: expect.any(String),
        creator: {
          id: user.id,
        },
      });
    });

    test("can create an extant PropositionCompound-based justification targeting a proposition", async () => {
      // Arrange
      const { authToken, user } = await testHelper.makeUser();

      const createPropositionCompound = {
        atoms: [
          { entity: { text: "Socrates is a man" } },
          { entity: { text: "All men are mortal" } },
        ],
      };
      const now = moment();
      const { propositionCompound: propositionCompoundOut } =
        await propositionCompoundsService.createValidPropositionCompoundAsUser(
          createPropositionCompound,
          user.id,
          now
        );

      const createJustification: CreateJustification = {
        target: {
          type: "PROPOSITION",
          entity: {
            text: "Socrates is mortal.",
          },
        },
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: propositionCompoundOut,
        },
        polarity: "POSITIVE",
      };

      // Act
      const { isExtant, justification: justificationOut } =
        await service.readOrCreate(createJustification, authToken);

      // Assert
      expect(isExtant).toBe(false);
      expect(justificationOut).toMatchObject(
        merge({}, createJustification, {
          id: expect.any(String),
          creator: {
            id: user.id,
          },
        })
      );
    });
    test("can create an extant WritQuote-based justification targeting a proposition", async () => {
      // Arrange
      const { authToken, user } = await testHelper.makeUser();

      const createWritQuote = {
        quoteText:
          "Extensive scientific reports indicate that Socrates is mortal.",
        writ: {
          title: "Trustworthy online news source",
        },
        urls: [{ url: "https://www.trustworthy.news" }],
      };
      const { writQuote: writQuoteOut } =
        await writQuotesService.createWritQuote({
          writQuote: createWritQuote,
          authToken,
        });

      const createJustification: CreateJustification = {
        target: {
          type: "PROPOSITION",
          entity: {
            text: "Socrates is mortal.",
          },
        },
        basis: {
          type: "WRIT_QUOTE",
          entity: writQuoteOut,
        },
        polarity: "POSITIVE",
      };

      // Act
      const { isExtant, justification: justificationOut } =
        await service.readOrCreate(createJustification, authToken);

      // Assert
      expect(isExtant).toBe(false);
      expect(justificationOut).toMatchObject({
        ...createJustification,
        id: expect.any(String),
        creator: {
          id: user.id,
        },
      });
    });

    test("can create a writ quote based justification targeting a statement", async () => {
      // Arrange
      const { authToken, user } = await testHelper.makeUser();

      const createJustification = makeWritQuoteBasedJustification();

      // Act
      const { isExtant, justification: justificationOut } =
        await service.readOrCreate(createJustification, authToken);

      // Assert
      expect(isExtant).toBe(false);
      expect(justificationOut).toMatchObject({
        ...createJustification,
        id: expect.any(String),
        creator: {
          id: user.id,
        },
      });
    });

    test("fails to create a writ quote based justification with a javascript URL", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();

      const createJustification = makeWritQuoteBasedJustification(
        "javascript:alert('gotcha')"
      );

      // Act
      let err;
      try {
        // Act
        await service.readOrCreate(createJustification, authToken);
        throw "Should have failed validation.";
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err).toBeInstanceOf(EntityValidationError);
      expect(err).toMatchObject({
        errors: {
          basis: {
            entity: {
              urls: {
                0: {
                  url: {
                    _errors: [
                      {
                        message: expect.stringContaining("Must be a valid URL"),
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      });
    });
    test("can create a counter justification", async () => {
      // Arrange
      const { authToken, user } = await testHelper.makeUser();

      const createJustification = makePropositionCompoundBasedJustification();

      const { justification: justificationOut } = await service.readOrCreate(
        createJustification,
        authToken
      );

      const createCounterJustification =
        makeCounterJustificationTargeting(justificationOut);

      // Act
      const { isExtant, justification: counterJustificationOut } =
        await service.readOrCreate(createCounterJustification, authToken);

      // Assert
      expect(isExtant).toBe(false);
      expect(counterJustificationOut).toMatchObject({
        id: expect.any(String),
        target: {
          type: "JUSTIFICATION",
          entity: {
            id: justificationOut.id,
          },
        },
        basis: createCounterJustification.basis,
        creator: {
          id: user.id,
        },
      });
    });
    test("can read a justification equivalent to a proposition compound based justification targeting a proposition", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();

      const createJustification1 = makePropositionCompoundBasedJustification();
      const { justification: justificationOut1 } = await service.readOrCreate(
        createJustification1,
        authToken
      );

      const createJustification2 = makePropositionCompoundBasedJustification();

      // Act
      const { isExtant, justification: justificationOut2 } =
        await service.readOrCreate(createJustification2, authToken);

      // Assert
      expect(isExtant).toBe(true);
      expect(justificationOut2).toMatchObject({
        ...createJustification2,
        id: justificationOut1.id,
      });
    });
    test("can read a justification equivalent to a writ quote based justification targeting a statement", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();

      const createJustification1 = makeWritQuoteBasedJustification();
      const { justification: justificationOut1 } = await service.readOrCreate(
        createJustification1,
        authToken
      );

      const createJustification2 = makeWritQuoteBasedJustification();

      // Act
      const { isExtant, justification: justificationOut2 } =
        await service.readOrCreate(createJustification2, authToken);

      // Assert
      expect(isExtant).toBe(true);
      expect(justificationOut2).toMatchObject({
        ...createJustification2,
        id: justificationOut1.id,
      });
    });
    test("can read an equivalent counter justification", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();

      const createJustification = makeWritQuoteBasedJustification();
      const { justification: justificationOut } = await service.readOrCreate(
        createJustification,
        authToken
      );

      const createCounterJustification1 =
        makeCounterJustificationTargeting(justificationOut);
      const { justification: counterJustificationOut1 } =
        await service.readOrCreate(createCounterJustification1, authToken);

      const createCounterJustification2 =
        makeCounterJustificationTargeting(justificationOut);

      // Act
      const { isExtant, justification: counterJustificationOut2 } =
        await service.readOrCreate(createCounterJustification2, authToken);

      // Assert
      expect(isExtant).toBe(true);
      expect(counterJustificationOut2).toMatchObject({
        ...createCounterJustification2,
        rootTarget: {
          id: counterJustificationOut1.rootTarget.id,
        },
        target: {
          type: "JUSTIFICATION",
          entity: {
            id: createCounterJustification2.target.entity.id,
          },
        },
        id: counterJustificationOut1.id,
      });
    });
    test("raises an authentication error if there is no auth token", async () => {
      const createJustification = makeWritQuoteBasedJustification();
      const authToken = undefined as unknown as string;
      await expect(
        service.readOrCreate(createJustification, authToken)
      ).rejects.toBeInstanceOf(UnauthenticatedError);
    });
    test("raises a validation error if the justification is invalid", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();

      const createJustification: CreateJustification = {
        target: {
          type: "PROPOSITION",
          entity: {
            // Empty text is not valid
            text: "",
          },
        },
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: {
            atoms: [
              { entity: { text: "Socrates is a man" } },
              { entity: { text: "All men are mortal" } },
            ],
          },
        },
        polarity: "POSITIVE",
      };

      let err;
      try {
        // Act
        await service.readOrCreate(createJustification, authToken);
        throw "Should have failed validation.";
      } catch (e) {
        err = e;
      }

      // Assert
      expect(err).toBeInstanceOf(EntityValidationError);
      expect(err).toMatchObject({
        errors: {
          target: {
            entity: {
              text: {
                _errors: [
                  {
                    message: expect.stringContaining(
                      "String must contain at least 1 character"
                    ),
                  },
                ],
              },
            },
          },
        },
      });
    });
  });
  describe("readJustifications", () => {
    test("Can read initial justifications", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();
      const createJustifications = Array.from(Array(20).keys()).map((i) =>
        makeJustificationWithTargetPropositionText(`Socrates is mortal ${i}`)
      );
      for (const createJustification of createJustifications) {
        await service.readOrCreate(createJustification, authToken);
      }

      const filters: JustificationSearchFilters = {};
      const sorts: SortDescription[] = [];
      const continuationToken = undefined;
      const count = 10;
      const includeUrls = true;

      // Act
      const {
        continuationToken: continuationTokenOut,
        justifications: justificationOuts,
      } = await service.readJustifications({
        filters,
        sorts,
        continuationToken,
        count,
        includeUrls,
      });

      // Assert
      expect(continuationTokenOut).toEqual(expect.any(String));
      expect(justificationOuts).toHaveLength(10);
    });
    test("Can read more justifications", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();
      const createJustifications = Array.from(Array(20).keys()).map((i) =>
        makeJustificationWithTargetPropositionText(`Socrates is mortal ${i}`)
      );
      for (const createJustification of createJustifications) {
        await service.readOrCreate(createJustification, authToken);
      }

      const filters: JustificationSearchFilters = {};
      const sorts: SortDescription[] = [];
      const count = 12;
      const includeUrls = true;

      const { continuationToken } = await service.readJustifications({
        filters,
        sorts,
        continuationToken: undefined,
        count,
        includeUrls,
      });

      // Act
      const {
        continuationToken: continuationTokenOut,
        justifications: justificationOuts,
      } = await service.readJustifications({
        filters,
        sorts,
        continuationToken,
        count,
        includeUrls,
      });

      // Assert
      expect(continuationTokenOut).toEqual(expect.any(String));
      expect(justificationOuts).toHaveLength(8);
    });
  });
  describe("readJustificationsForRootTarget", () => {
    test("can read justifications for a proposition root target", async () => {
      const { user, authToken } = await testHelper.makeUser();

      const createJustifications = Array.from(Array(20).keys()).map((i) =>
        makeJustificationWithBasisPropositionText(
          `We hold these truths to be self-evident ${i}`
        )
      );
      let justificationOut: JustificationOut | undefined;
      for (const createJustification of createJustifications) {
        const { justification } = await service.readOrCreate(
          createJustification,
          authToken
        );
        justificationOut = justification;
      }
      if (!justificationOut) {
        throw new Error("justificationOut must be defined.");
      }

      // Ensure we have counter-justifications
      const createCounterJustification =
        makeCounterJustificationTargeting(justificationOut);
      await service.readOrCreate(createCounterJustification, authToken);

      // Act
      const justificationOuts = await service.readJustificationsForRootTarget(
        "PROPOSITION",
        justificationOut.rootTarget.id,
        user.id
      );

      // Just the top-level justifications; counterJustifications are attached to these.
      expect(justificationOuts).toHaveLength(20);
      const counteredJustificationOut = filter(
        justificationOuts,
        (j) => j.id === justificationOut?.id
      )[0];
      expect(counteredJustificationOut.counterJustifications).toHaveLength(1);
      expect(counteredJustificationOut.counterJustifications[0]).toMatchObject({
        ...createCounterJustification,
        // Counter justifications only refer to their targets
        target: {
          type: "JUSTIFICATION",
          entity: {
            id: createCounterJustification.target.entity.id,
          },
        },
        id: expect.any(String),
      });
    });

    test("can read a media excerpt based justification for a proposition root target", async () => {
      const { user, authToken } = await testHelper.makeUser();

      const proposition = await testHelper.makeProposition({ authToken });
      const mediaExcerpt = await testHelper.makeMediaExcerpt({ authToken });
      const createJustification: CreateJustification = {
        target: {
          type: "PROPOSITION",
          entity: proposition,
        },
        basis: {
          type: "MEDIA_EXCERPT",
          entity: mediaExcerpt,
        },
        polarity: "POSITIVE",
      };

      const { justification } = await service.readOrCreate(
        createJustification,
        authToken
      );

      // Act
      const justifications = await service.readJustificationsForRootTarget(
        "PROPOSITION",
        proposition.id,
        user.id
      );

      // Assert
      const expectedJustification = {
        ...justification,
        rootTarget: {
          id: proposition.id,
        },
        target: {
          type: "PROPOSITION",
          entity: {
            id: proposition.id,
          },
        },
        basis: {
          ...justification.basis,
          entity: {
            ...justification.basis.entity,
            justificationBasisUsageCount: 1,
          },
        },
      };
      expect(justifications).toEqual(
        expectToBeSameMomentDeep([expectedJustification])
      );
    });
  });
  describe("deleteJustification", () => {
    test("can delete justification", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();

      const createJustification = makePropositionCompoundBasedJustification();

      const { justification: justificationOut } = await service.readOrCreate(
        createJustification,
        authToken
      );

      // Act
      const { deletedJustificationId, deletedCounterJustificationIds } =
        await service.deleteJustification(authToken, justificationOut.id);

      // Assert
      expect(deletedJustificationId).toBe(justificationOut.id);
      expect(deletedCounterJustificationIds).toEqual([]);
    });
    test("can delete justification with counter justifications", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();

      const createJustification = makePropositionCompoundBasedJustification();
      const { justification: justificationOut } = await service.readOrCreate(
        createJustification,
        authToken
      );

      const createCounterJustification =
        makeCounterJustificationTargeting(justificationOut);
      const { justification: counterJustificationOut } =
        await service.readOrCreate(createCounterJustification, authToken);

      // Act
      const { deletedJustificationId, deletedCounterJustificationIds } =
        await service.deleteJustification(authToken, justificationOut.id);

      // Assert
      expect(deletedJustificationId).toBe(justificationOut.id);
      expect(deletedCounterJustificationIds).toEqual([
        counterJustificationOut.id,
      ]);
    });
    test("cannot read deleted (counter) justifications by ID", async () => {
      // Arrange
      const {
        authToken,
        user: { id: userId },
      } = await testHelper.makeUser();

      const createJustification = makePropositionCompoundBasedJustification();
      const { justification: justificationOut } = await service.readOrCreate(
        createJustification,
        authToken
      );

      const createCounterJustification =
        makeCounterJustificationTargeting(justificationOut);
      const { justification: counterJustificationOut } =
        await service.readOrCreate(createCounterJustification, authToken);

      await service.deleteJustification(authToken, justificationOut.id);

      // Act/Assert
      let err: Error | undefined;
      try {
        await service.readJustificationForId(justificationOut.id, userId);
      } catch (e) {
        if (!(e instanceof EntityNotFoundError)) {
          throw e;
        }
        err = e;
      }
      expect(err).toBeInstanceOf(EntityNotFoundError);

      let counterErr: Error | undefined;
      try {
        await service.readJustificationForId(
          counterJustificationOut.id,
          userId
        );
      } catch (e) {
        if (!(e instanceof EntityNotFoundError)) {
          throw e;
        }
        counterErr = e;
      }
      expect(counterErr).toBeInstanceOf(EntityNotFoundError);
    });
    test("cannot read deleted (counter) justifications by filters", async () => {
      // Arrange
      const { authToken } = await testHelper.makeUser();

      const createJustification = makeJustificationWithTargetPropositionText(
        "We will delete this one."
      );
      const { justification: justificationOut } = await service.readOrCreate(
        createJustification,
        authToken
      );

      const createCounterJustification =
        makeCounterJustificationTargeting(justificationOut);
      await service.readOrCreate(createCounterJustification, authToken);

      const survivingCreateJustification =
        makeJustificationWithTargetPropositionText(
          "We will not delete this one."
        );
      const { justification: survivingJustificationOut } =
        await service.readOrCreate(survivingCreateJustification, authToken);

      const survivingCreateCounterJustification =
        makeCounterJustificationTargeting(survivingJustificationOut);
      const { justification: survivingCounterJustificationOut } =
        await service.readOrCreate(
          survivingCreateCounterJustification,
          authToken
        );

      // Delete one of the justifications (which should delete the counter to it.)
      await service.deleteJustification(authToken, justificationOut.id);

      const filters: JustificationSearchFilters = {};
      const sorts: SortDescription[] = [];
      const continuationToken = undefined;
      const count = 10;
      const includeUrls = true;

      // Act
      const { justifications: justificationsOut } =
        await service.readJustifications({
          filters,
          sorts,
          continuationToken,
          count,
          includeUrls,
        });

      // Assert
      expect(justificationsOut).toIncludeSameMembers([
        expect.objectContaining({
          id: survivingJustificationOut.id,
        }),
        expect.objectContaining({
          id: survivingCounterJustificationOut.id,
        }),
      ]);
    });
  });
});

function makeCounterJustificationTargeting(
  justification: JustificationOut
): CreateCounterJustification {
  return {
    target: {
      type: "JUSTIFICATION",
      entity: justification,
    },
    basis: {
      type: "PROPOSITION_COMPOUND",
      entity: {
        atoms: [
          { entity: { text: "Socrates is a man" } },
          { entity: { text: "All men are mortal" } },
        ],
      },
    },
    polarity: "NEGATIVE",
    rootPolarity: negateRootPolarity(justification.polarity),
  };
}

function makeJustificationWithTargetPropositionText(
  text: string
): CreateJustification {
  return {
    target: {
      type: "PROPOSITION",
      entity: {
        text,
      },
    },
    basis: {
      type: "PROPOSITION_COMPOUND",
      entity: {
        atoms: [
          { entity: { text: "Socrates is a man" } },
          { entity: { text: "All men are mortal" } },
        ],
      },
    },
    polarity: "POSITIVE",
  };
}

function makeJustificationWithBasisPropositionText(
  text: string
): CreateJustification {
  return {
    target: {
      type: "PROPOSITION",
      entity: {
        text: "All people are created equal",
      },
    },
    basis: {
      type: "PROPOSITION_COMPOUND",
      entity: {
        atoms: [{ entity: { text } }],
      },
    },
    polarity: "POSITIVE",
  };
}

function makePropositionCompoundBasedJustification(): CreateJustification {
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
        atoms: [
          { entity: { text: "Socrates is a man" } },
          { entity: { text: "All men are mortal" } },
        ],
      },
    },
    polarity: "POSITIVE",
  };
}

function makeWritQuoteBasedJustification(
  url = "https://www.trustworthy.news/"
): CreateJustification {
  return {
    target: {
      type: "PROPOSITION",
      entity: {
        text: "Socrates is mortal.",
      },
    },
    basis: {
      type: "WRIT_QUOTE",
      entity: {
        quoteText:
          "Extensive scientific reports indicate that Socrates is mortal.",
        writ: {
          title: "Trustworthy online news source",
        },
        urls: [{ url: url }],
      },
    },
    polarity: "POSITIVE",
  };
}
