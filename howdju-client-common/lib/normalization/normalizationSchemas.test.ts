import { map } from "lodash";
import moment from "moment";
import { normalize } from "normalizr";

import { JustificationOut, PropositionOut } from "howdju-common";

import { propositionSchema } from "./normalizationSchemas";

describe("normalizationSchemas", () => {
  describe("propositionSchema", () => {
    test("normalizes a proposition", () => {
      const json = { id: 1, text: "a proposition" };
      expect(normalize(json, propositionSchema)).toEqual({
        result: 1,
        entities: {
          propositions: { 1: { ...json, key: 1, slug: "a-proposition" } },
        },
      });
    });

    test("normalizes a proposition with justifications", () => {
      const proposition1: PropositionOut = {
          id: "1",
          text: "a proposition",
          normalText: "a proposition",
          justifications: [],
          created: moment(),
        },
        proposition2: PropositionOut = {
          id: "2",
          text: "another proposition",
          normalText: "another proposition",
          created: moment(),
        },
        proposition3: PropositionOut = {
          id: "3",
          text: "yet another proposition",
          normalText: "yet another proposition",
          created: moment(),
        },
        propositionCompound1 = {
          id: "4",
          atoms: [{ entity: proposition2, propositionCompoundId: "4" }],
        },
        propositionCompound2 = {
          id: "5",
          atoms: [{ entity: proposition3, propositionCompoundId: "5" }],
        },
        justification1: JustificationOut = {
          id: "1",
          // normalizer cannot normalize circular data
          target: { type: "PROPOSITION", entity: { ...proposition1 } },
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: propositionCompound1,
          },
          polarity: "POSITIVE",
          created: moment(),
          rootPolarity: "POSITIVE",
          rootTargetType: "PROPOSITION",
          rootTarget: { ...proposition1 },
        },
        justification2: JustificationOut = {
          id: "2",
          target: { type: "PROPOSITION", entity: { ...proposition1 } },
          basis: {
            type: "PROPOSITION_COMPOUND",
            entity: propositionCompound2,
          },
          polarity: "POSITIVE",
          created: moment(),
          rootPolarity: "POSITIVE",
          rootTargetType: "PROPOSITION",
          rootTarget: { ...proposition1 },
        };
      proposition1.justifications = [justification1, justification2];
      const expected = {
        result: proposition1.id,
        entities: {
          propositions: {
            1: {
              ...proposition1,
              justifications: map(proposition1.justifications, (j) => j.id),
              key: "1",
              slug: "a-proposition",
            },
            2: { ...proposition2, key: "2", slug: "another-proposition" },
            3: { ...proposition3, key: "3", slug: "yet-another-proposition" },
          },
          justifications: {
            1: {
              ...justification1,
              target: {
                type: "PROPOSITION",
                entity: { id: "1", schema: "PROPOSITION" },
              },
              basis: {
                type: "PROPOSITION_COMPOUND",
                entity: { id: "4", schema: "PROPOSITION_COMPOUND" },
              },
              rootTarget: {
                id: proposition1.id,
                schema: "PROPOSITION",
              },
            },
            2: {
              ...justification2,
              target: {
                type: "PROPOSITION",
                entity: { id: "1", schema: "PROPOSITION" },
              },
              basis: {
                type: "PROPOSITION_COMPOUND",
                entity: { id: "5", schema: "PROPOSITION_COMPOUND" },
              },
              rootTarget: {
                id: proposition1.id,
                schema: "PROPOSITION",
              },
            },
          },
          propositionCompounds: {
            4: {
              atoms: ["4-2"],
              id: "4",
            },
            5: {
              atoms: ["5-3"],
              id: "5",
            },
          },
          propositionCompoundAtoms: {
            "4-2": {
              entity: "2",
              key: "4-2",
              propositionCompoundId: "4",
            },
            "5-3": {
              entity: "3",
              key: "5-3",
              propositionCompoundId: "5",
            },
          },
        },
      };

      expect(normalize(proposition1, propositionSchema)).toEqual(expected);
    });
  });
});
