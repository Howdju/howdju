import { merge } from "lodash";
import moment from "moment";

import {
  brandedParse,
  JustificationPolarities,
  JustificationRootTargetTypes,
  JustificationTargetTypes,
  PropositionOut,
  PropositionRef,
  mergeCopy,
  JustificationOut,
  JustificationRef,
  negateRootPolarity,
  PropositionCompoundRef,
} from "howdju-common";
import { expectToBeSameMomentDeep } from "howdju-test-common";

import { api } from "../actions";
import entities, {
  initialState as defaultInitialState,
  State,
  deepMerge,
  NormalizedJustification,
} from "./entities";
import {
  justificationSchema,
  propositionSchema,
} from "../normalizationSchemas";
import { normalizeEntity } from "@/testUtils";

describe("deepmerge", () => {
  test("should uniquely merge arrays", () => {
    expect(deepMerge({ a: [1, 2] }, { a: [2, 3] })).toEqual({
      a: [1, 2, 3],
    });
  });
});

describe("entities", () => {
  describe("api.createJustification.response", () => {
    test("should add justifications to targets", () => {
      const targetProposition: PropositionOut = brandedParse(PropositionRef, {
        id: "1",
        text: "target proposition",
        created: moment(),
      });
      const normalTargetProposition = normalizeEntity(
        targetProposition,
        propositionSchema
      );

      const existingJustification: JustificationOut = brandedParse(
        JustificationRef,
        {
          id: "1",
          rootTargetType: "PROPOSITION",
          rootTarget: targetProposition,
          target: {
            type: "PROPOSITION",
            entity: targetProposition,
          },
          created: moment(),
          polarity: "POSITIVE",
          rootPolarity: "POSITIVE",
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: brandedParse(PropositionCompoundRef, {
              id: "1",
              atoms: [
                {
                  propositionCompoundId: "1",
                  entity: brandedParse(PropositionRef, {
                    id: "4",
                    text: "atom 1",
                    created: moment(),
                  }),
                },
              ],
            }),
          },
        }
      );

      // TODO use normalize(existingJustification, justificationSchema) instead
      const normalExistingJustification: NormalizedJustification = brandedParse(
        JustificationRef,
        {
          id: "1",
          rootTargetType: "PROPOSITION",
          rootTarget: { schema: "PROPOSITION", id: targetProposition.id },
          target: {
            type: "PROPOSITION",
            entity: {
              schema: "PROPOSITION",
              id: targetProposition.id,
            },
          },
          created: moment(),
          polarity: "POSITIVE",
          rootPolarity: "POSITIVE",
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: {
              schema: "PROPOSITION_COMPOUND",
              id: "1",
            },
          },
        }
      );

      targetProposition.justifications = [existingJustification];

      const initialState = mergeCopy(defaultInitialState, {
        propositions: {
          [targetProposition.id]: targetProposition,
        },
        justifications: {
          [normalExistingJustification.id]: normalExistingJustification,
        },
      });

      const newJustification: JustificationOut = brandedParse(
        JustificationRef,
        {
          id: "2",
          rootTargetType: JustificationRootTargetTypes.PROPOSITION,
          rootTarget: { id: "1" },
          target: {
            type: "PROPOSITION",
            entity: targetProposition,
          },
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: brandedParse(PropositionCompoundRef, {
              id: "2",
              atoms: [
                {
                  propositionCompoundId: "2",
                  entity: brandedParse(PropositionRef, {
                    id: "3",
                    text: "atom 1",
                    created: moment(),
                  }),
                },
              ],
            }),
          },
          created: moment(),
          polarity: "POSITIVE",
          rootPolarity: "POSITIVE",
        }
      );
      const action = api.createJustification.response(
        { justification: newJustification },
        { normalizationSchema: { justification: justificationSchema } }
      );

      // Act
      const newState = entities(initialState as State, action);

      // Assert

      const normalNewJustification = normalizeEntity(
        newJustification,
        justificationSchema
      );
      const expectedState = {
        ...defaultInitialState,
        propositions: {
          [targetProposition.id]: {
            ...normalTargetProposition,
            justifications: [
              normalExistingJustification.id,
              newJustification.id,
            ],
          },
        },
        justifications: {
          [normalExistingJustification.id]: normalExistingJustification,
          [normalNewJustification.id]: normalNewJustification,
        },
      };
      // const expectedState = omitDeep(
      //   {
      //     propositions: {
      //       [targetProposition.id]: {
      //         ...targetProposition,
      //         key: "1",
      //         slug: "target-proposition",
      //         justifications: [
      //           normalExistingJustification.id,
      //           newJustification.id,
      //         ],
      //       },
      //     },
      //     justifications: {
      //       [normalExistingJustification.id]: normalExistingJustification,
      //       [newJustification.id]: merge({}, newJustification, {
      //         target: {
      //           entity: {
      //             text: toOmit,
      //             justifications: toOmit,
      //             created: toOmit,
      //             schema: JustificationTargetTypes.PROPOSITION,
      //           },
      //         },
      //         rootTarget: {
      //           schema: JustificationRootTargetTypes.PROPOSITION,
      //         },
      //       }),
      //     },
      //   },
      //   (val) => val === toOmit
      // );
      expect(newState).toEqual(expectToBeSameMomentDeep(expectedState));
    });

    test("should add counter-justifications to a target with no counter-justifications", () => {
      const rootProposition: PropositionOut = brandedParse(PropositionRef, {
        id: "1",
        text: "root proposition",
        created: moment(),
      });
      const targetJustification: JustificationOut = brandedParse(
        JustificationRef,
        {
          id: "2",
          rootTargetType: JustificationRootTargetTypes.PROPOSITION,
          rootTarget: { id: rootProposition.id },
          target: {
            type: JustificationTargetTypes.PROPOSITION,
            entity: rootProposition,
          },
          created: moment(),
          polarity: "POSITIVE",
          rootPolarity: "POSITIVE",
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: brandedParse(PropositionCompoundRef, {
              id: "4",
              atoms: [],
            }),
          },
        }
      );
      const normalTargetJustification: NormalizedJustification = brandedParse(
        JustificationRef,
        {
          id: targetJustification.id,
          rootTarget: {
            schema: "PROPOSITION",
            id: rootProposition.id,
          },
          rootTargetType: "PROPOSITION",
          target: {
            type: "PROPOSITION",
            entity: {
              schema: "PROPOSITION",
              id: rootProposition.id,
            },
          },
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: {
              schema: "PROPOSITION_COMPOUND",
              id: "4",
            },
          },
          created: targetJustification.created,
          rootPolarity: "POSITIVE",
          polarity: "POSITIVE",
        }
      );
      const normalRootProposition = mergeCopy(rootProposition, {
        justifications: [targetJustification.id],
      });
      const counterJustification: JustificationOut = brandedParse(
        JustificationRef,
        {
          id: "3",
          rootTargetType: "PROPOSITION",
          rootTarget: rootProposition,
          rootPolarity: negateRootPolarity(targetJustification.rootPolarity),
          target: {
            type: JustificationTargetTypes.JUSTIFICATION,
            entity: targetJustification,
          },
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: brandedParse(PropositionCompoundRef, {
              id: "5",
              atoms: [],
            }),
          },
          polarity: JustificationPolarities.NEGATIVE,
          created: moment(),
        }
      );
      const initialState = mergeCopy(defaultInitialState, {
        propositions: {
          [rootProposition.id]: normalRootProposition,
        },
        justifications: {
          [normalTargetJustification.id]: normalTargetJustification,
        },
      });
      const action = api.createJustification.response(
        { justification: counterJustification },
        { normalizationSchema: { justification: justificationSchema } }
      );

      // Act
      const newState = entities(initialState as State, action);

      // Assert
      const normalCounterJustification = {
        id: counterJustification.id,
        polarity: "NEGATIVE",
        rootTarget: {
          schema: "PROPOSITION",
          id: rootProposition.id,
        },
        rootTargetType: "PROPOSITION",
        target: {
          entity: {
            schema: "JUSTIFICATION",
            id: targetJustification.id,
          },
          type: "JUSTIFICATION",
        },
        basis: {
          entity: {
            schema: "PROPOSITION_COMPOUND",
            id: "5",
          },
          type: "PROPOSITION_COMPOUND",
        },
      };
      const expectedState = merge({}, initialState, {
        justifications: {
          [targetJustification.id]: {
            counterJustifications: [counterJustification.id],
          },
          [counterJustification.id]: normalCounterJustification,
        },
      });
      expect(newState).toMatchObject(expectToBeSameMomentDeep(expectedState));
    });

    test("should add counter-justifications to a target with existing counter-justifications", () => {
      const rootProposition: PropositionOut = brandedParse(PropositionRef, {
        id: "1",
        text: "root proposition",
        created: moment(),
      });
      const targetJustification: JustificationOut = brandedParse(
        JustificationRef,
        {
          id: "2",
          rootTargetType: JustificationRootTargetTypes.PROPOSITION,
          rootTarget: rootProposition,
          target: {
            type: JustificationTargetTypes.PROPOSITION,
            entity: rootProposition,
          },
          created: moment(),
          polarity: "POSITIVE",
          rootPolarity: "POSITIVE",
          counterJustifications: [],
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: brandedParse(PropositionCompoundRef, {
              id: "3",
              atoms: [],
            }),
          },
        }
      );
      const existingCounterJustification: JustificationOut = brandedParse(
        JustificationRef,
        {
          id: "3",
          rootTargetType: JustificationRootTargetTypes.PROPOSITION,
          rootTarget: rootProposition,
          rootPolarity: negateRootPolarity(targetJustification.rootPolarity),
          target: {
            type: "JUSTIFICATION",
            entity: targetJustification,
          },
          polarity: JustificationPolarities.NEGATIVE,
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: brandedParse(PropositionCompoundRef, {
              id: "4",
              atoms: [],
            }),
          },
          created: moment(),
        }
      );
      targetJustification.counterJustifications = [
        existingCounterJustification,
      ];
      const normalTargetJustification = {
        rootTarget: {
          schema: "PROPOSITION",
          id: rootProposition.id,
        },
        target: {
          entity: {
            schema: "PROPOSITION",
            id: rootProposition.id,
          },
        },
        basis: {
          entity: {
            schema: "PROPOSITION_COMPOUND",
            id: "3",
          },
        },
        counterJustifications: [existingCounterJustification.id],
      };
      const normalExistingCounterJustification = {
        id: existingCounterJustification.id,
        polarity: "NEGATIVE",
        rootTarget: {
          schema: "PROPOSITION",
          id: rootProposition.id,
        },
        rootTargetType: "PROPOSITION",
        target: {
          entity: {
            schema: "JUSTIFICATION",
            id: targetJustification.id,
          },
          type: "JUSTIFICATION",
        },
        basis: {
          entity: {
            schema: "PROPOSITION_COMPOUND",
            id: "4",
          },
          type: "PROPOSITION_COMPOUND",
        },
      };
      const newCounterJustification = {
        id: "4",
        rootTargetType: "PROPOSITION",
        rootTarget: rootProposition,
        target: {
          type: "JUSTIFICATION",
          entity: targetJustification,
        },
        polarity: "NEGATIVE",
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: {
            id: "5",
            atoms: [],
          },
        },
      };
      const initialState = mergeCopy(defaultInitialState, {
        propositions: {
          [rootProposition.id]: rootProposition,
        },
        justifications: {
          [targetJustification.id]: normalTargetJustification,
          [existingCounterJustification.id]: normalExistingCounterJustification,
        },
      });
      const action = api.createJustification.response(
        { justification: newCounterJustification },
        { normalizationSchema: { justification: justificationSchema } }
      );

      // Act
      const newState = entities(initialState as State, action);

      // Assert
      const normalNewCounterJustification = {
        id: newCounterJustification.id,
        polarity: "NEGATIVE",
        rootTarget: {
          schema: "PROPOSITION",
          id: rootProposition.id,
        },
        rootTargetType: "PROPOSITION",
        target: {
          entity: {
            schema: "JUSTIFICATION",
            id: targetJustification.id,
          },
          type: "JUSTIFICATION",
        },
        basis: {
          entity: {
            schema: "PROPOSITION_COMPOUND",
            id: "5",
          },
          type: "PROPOSITION_COMPOUND",
        },
      };
      const expectedState = {
        propositions: {
          [rootProposition.id]: rootProposition,
        },
        justifications: {
          [targetJustification.id]: merge({}, normalTargetJustification, {
            counterJustifications: [
              existingCounterJustification.id,
              newCounterJustification.id,
            ],
          }),
          [existingCounterJustification.id]: normalExistingCounterJustification,
          [newCounterJustification.id]: normalNewCounterJustification,
        },
      };
      expect(newState).toMatchObject(expectToBeSameMomentDeep(expectedState));
    });

    test.todo("TODO(#277) should add a counter-counter-justification");
  });

  describe("api.deleteJustification.response", () => {
    test("should remove deleted counter-justification from countered justification", () => {
      const rootProposition = { id: "1" },
        targetJustification: NormalizedJustification = brandedParse(
          JustificationRef,
          {
            rootTargetType: "PROPOSITION",
            rootTarget: { schema: "PROPOSITION", id: rootProposition.id },
            id: "2",
            counterJustifications: [] as string[],
            created: moment(),
            polarity: "POSITIVE",
            rootPolarity: "POSITIVE",
            target: {
              type: "PROPOSITION",
              entity: { schema: "PROPOSITION", id: rootProposition.id },
            },
            basis: {
              type: "PROPOSITION_COMPOUND",
              entity: { schema: "PROPOSITION_COMPOUND", id: "3" },
            },
          }
        ),
        counterJustification: NormalizedJustification = brandedParse(
          JustificationRef,
          {
            id: "3",
            polarity: JustificationPolarities.NEGATIVE,
            target: {
              type: JustificationTargetTypes.JUSTIFICATION,
              entity: {
                schema: "JUSTIFICATION",
                id: targetJustification.id,
              },
            },
            rootTargetType: "PROPOSITION",
            rootTarget: { schema: "PROPOSITION", id: rootProposition.id },
            created: moment(),
            rootPolarity: negateRootPolarity(targetJustification.rootPolarity),
            basis: {
              type: "PROPOSITION_COMPOUND",
              entity: { schema: "PROPOSITION_COMPOUND", id: "4" },
            },
          }
        ),
        initialState = mergeCopy(defaultInitialState, {
          justifications: {
            [targetJustification.id]: targetJustification,
            [counterJustification.id]: counterJustification,
          },
        }),
        action = api.deleteJustification.response(null, {
          requestMeta: {
            justificationId: counterJustification.id,
            justificationTargetType: counterJustification.target.type,
            justificationTargetId: counterJustification.target.entity,
          },
        });
      targetJustification.counterJustifications = [counterJustification.id];

      const actualState = entities(initialState as State, action);

      const actualCounterJustifications =
        actualState.justifications[targetJustification.id]
          .counterJustifications;
      expect(actualCounterJustifications).not.toContainEqual(
        counterJustification.id
      );
    });
  });
});
