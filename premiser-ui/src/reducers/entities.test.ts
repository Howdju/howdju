import { merge } from "lodash";
import moment from "moment";

import {
  JustificationPolarities,
  JustificationRootTargetTypes,
  JustificationTargetTypes,
  PropositionOut,
  mergeCopy,
  JustificationOut,
  negateRootPolarity,
} from "howdju-common";
import {
  api,
  justificationSchema,
  propositionCompoundAtomSchema,
  propositionCompoundSchema,
  propositionSchema,
} from "howdju-client-common";
import { expectToBeSameMomentDeep } from "howdju-test-common";

import entities, {
  initialState as defaultInitialState,
  State,
  deepMerge,
  NormalizedJustification,
} from "./entities";
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
      const targetProposition: PropositionOut = {
        id: "1",
        text: "target proposition",
        normalText: "target proposition",
        created: moment(),
      };
      const atom1Proposition = {
        id: "4",
        text: "atom 1",
        normalText: "atom 1",
        created: moment(),
      };
      const propositionCompound1 = {
        id: "1",
        atoms: [
          {
            propositionCompoundId: "1",
            entity: atom1Proposition,
          },
        ],
      };
      const existingJustification: JustificationOut = {
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
          entity: propositionCompound1,
        },
      };
      targetProposition.justifications = [existingJustification];
      const normalTargetProposition = normalizeEntity(
        targetProposition,
        propositionSchema
      );

      const normalExistingJustification = normalizeEntity(
        existingJustification,
        justificationSchema
      );
      const initialState = mergeCopy(defaultInitialState, {
        propositions: {
          [targetProposition.id]: normalTargetProposition,
        },
        justifications: {
          [normalExistingJustification.id]: normalExistingJustification,
        },
      });

      const atom2Proposition = {
        id: "3",
        text: "atom 1",
        normalText: "atom 1",
        created: moment(),
      };
      const propositionCompound2 = {
        id: "2",
        atoms: [
          {
            propositionCompoundId: "2",
            entity: atom2Proposition,
          },
        ],
      };
      const newJustification: JustificationOut = {
        id: "2",
        rootTargetType: JustificationRootTargetTypes.PROPOSITION,
        rootTarget: { id: "1" },
        target: {
          type: "PROPOSITION",
          entity: targetProposition,
        },
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: propositionCompound2,
        },
        created: moment(),
        polarity: "POSITIVE",
        rootPolarity: "POSITIVE",
      };
      const action = api.createJustification.response(
        { justification: newJustification },
        { normalizationSchema: { justification: justificationSchema } }
      );

      // Act
      const newState = entities(initialState as unknown as State, action);

      // Assert
      const normalNewJustification = normalizeEntity(
        newJustification,
        justificationSchema
      );
      const normalAtom1Proposition = normalizeEntity(
        atom1Proposition,
        propositionSchema
      );
      const normalAtom2Proposition = normalizeEntity(
        atom2Proposition,
        propositionSchema
      );
      const normalPropositionCompound1 = normalizeEntity(
        propositionCompound1,
        propositionCompoundSchema
      );
      const normalPropositionCompound2 = normalizeEntity(
        propositionCompound2,
        propositionCompoundSchema
      );
      const normalPropositionCompoundAtom1 = normalizeEntity(
        propositionCompound1.atoms[0],
        propositionCompoundAtomSchema
      );
      const normalPropositionCompoundAtom2 = normalizeEntity(
        propositionCompound2.atoms[0],
        propositionCompoundAtomSchema
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
          [atom1Proposition.id]: normalAtom1Proposition,
          [atom2Proposition.id]: normalAtom2Proposition,
        },
        justifications: {
          [normalExistingJustification.id]: normalExistingJustification,
          [normalNewJustification.id]: normalNewJustification,
        },
        propositionCompounds: {
          [propositionCompound1.id]: normalPropositionCompound1,
          [propositionCompound2.id]: normalPropositionCompound2,
        },
        propositionCompoundAtoms: {
          [normalPropositionCompoundAtom1.key]: normalPropositionCompoundAtom1,
          [normalPropositionCompoundAtom2.key]: normalPropositionCompoundAtom2,
        },
      };
      expect(newState).toEqual(expectToBeSameMomentDeep(expectedState));
    });

    test("should add counter-justifications to a target with no counter-justifications", () => {
      const rootProposition: PropositionOut = {
        id: "1",
        text: "root proposition",
        normalText: "root proposition",
        created: moment(),
      };
      const propositionCompound1 = {
        id: "4",
        atoms: [],
      };
      const targetJustification: JustificationOut = {
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
          entity: propositionCompound1,
        },
      };
      rootProposition.justifications = [targetJustification];
      const counterJustificationBasisPropositionCompound = {
        id: "5",
        atoms: [],
      };
      const counterJustification: JustificationOut = {
        id: "3",
        rootTargetType: "PROPOSITION",
        rootTarget: rootProposition,
        rootPolarity: negateRootPolarity(targetJustification.rootPolarity),
        target: {
          type: "JUSTIFICATION",
          entity: targetJustification,
        },
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: counterJustificationBasisPropositionCompound,
        },
        polarity: "NEGATIVE",
        created: moment(),
      };
      const normalRootProposition = normalizeEntity(
        rootProposition,
        propositionSchema
      );
      const normalTargetJustification = normalizeEntity(
        targetJustification,
        justificationSchema
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
      const newState = entities(initialState as unknown as State, action);

      // Assert
      const normalCounterJustification = normalizeEntity(
        counterJustification,
        justificationSchema
      );
      const normalPropositionCompound1 = normalizeEntity(
        propositionCompound1,
        propositionCompoundSchema
      );
      const normalCounterJustificationBasisPropositionCompound =
        normalizeEntity(
          counterJustificationBasisPropositionCompound,
          propositionCompoundSchema
        );
      const expectedState = merge({}, initialState, {
        justifications: {
          [targetJustification.id]: {
            counterJustifications: [counterJustification.id],
          },
          [counterJustification.id]: normalCounterJustification,
        },
        propositionCompounds: {
          [propositionCompound1.id]: normalPropositionCompound1,
          [counterJustificationBasisPropositionCompound.id]:
            normalCounterJustificationBasisPropositionCompound,
        },
      });
      expect(newState).toEqual(expectToBeSameMomentDeep(expectedState));
    });

    test("should add counter-justifications to a target with existing counter-justifications", () => {
      const rootProposition: PropositionOut = {
        id: "1",
        text: "root proposition",
        normalText: "root proposition",
        created: moment(),
      };
      const propositionCompound1 = {
        id: "3",
        atoms: [],
      };
      const targetJustification: JustificationOut = {
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
          entity: propositionCompound1,
        },
      };
      const propositionCompound2 = {
        id: "4",
        atoms: [],
      };
      const existingCounterJustification: JustificationOut = {
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
          entity: propositionCompound2,
        },
        created: moment(),
      };
      targetJustification.counterJustifications = [
        existingCounterJustification,
      ];

      const normalTargetJustification = normalizeEntity(
        targetJustification,
        justificationSchema
      );
      const normalExistingCounterJustification = normalizeEntity(
        existingCounterJustification,
        justificationSchema
      );
      const initialState = mergeCopy(defaultInitialState, {
        propositions: {
          [rootProposition.id]: rootProposition,
        },
        justifications: {
          [targetJustification.id]: normalTargetJustification,
          [existingCounterJustification.id]: normalExistingCounterJustification,
        },
      });

      const propositionCompound3 = {
        id: "3",
        atoms: [],
      };
      const newCounterJustification: JustificationOut = {
        id: "4",
        rootTargetType: "PROPOSITION",
        rootTarget: rootProposition,
        rootPolarity: negateRootPolarity(targetJustification.rootPolarity),
        target: {
          type: "JUSTIFICATION",
          entity: targetJustification,
        },
        polarity: "NEGATIVE",
        basis: {
          type: "PROPOSITION_COMPOUND",
          entity: propositionCompound3,
        },
        created: moment(),
      };
      const action = api.createJustification.response(
        { justification: newCounterJustification },
        { normalizationSchema: { justification: justificationSchema } }
      );

      // Act
      const newState = entities(initialState as unknown as State, action);

      // Assert
      const expectedState = merge({}, initialState, {
        propositions: {
          [rootProposition.id]: normalizeEntity(
            rootProposition,
            propositionSchema
          ),
        },
        justifications: {
          [targetJustification.id]: merge({}, normalTargetJustification, {
            counterJustifications: [
              existingCounterJustification.id,
              newCounterJustification.id,
            ],
          }),
          [existingCounterJustification.id]: normalExistingCounterJustification,
          [newCounterJustification.id]: normalizeEntity(
            newCounterJustification,
            justificationSchema
          ),
        },
        propositionCompounds: {
          [propositionCompound1.id]: normalizeEntity(
            propositionCompound1,
            propositionCompoundSchema
          ),
          [propositionCompound2.id]: normalizeEntity(
            propositionCompound2,
            propositionCompoundSchema
          ),
          [propositionCompound3.id]: normalizeEntity(
            propositionCompound3,
            propositionCompoundSchema
          ),
        },
      });
      expect(newState).toEqual(expectToBeSameMomentDeep(expectedState));
    });

    test.todo("TODO(#277) should add a counter-counter-justification");
  });

  describe("api.deleteJustification.response", () => {
    test("should remove deleted counter-justification from countered justification", () => {
      const rootProposition = { id: "1" };
      const targetJustification: NormalizedJustification = {
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
      };
      const counterJustification: NormalizedJustification = {
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
      };
      const initialState = mergeCopy(defaultInitialState, {
        justifications: {
          [targetJustification.id]: targetJustification,
          [counterJustification.id]: counterJustification,
        },
      });
      const action = api.deleteJustification.response(null, {
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
