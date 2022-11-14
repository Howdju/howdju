import cloneDeep from "lodash/cloneDeep";
import map from "lodash/map";

import {
  CounteredJustification,
  Entity,
  Perspective,
  PropositionCompound,
  PropositionCompoundAtom,
  Proposition,
  SourceExcerpt,
} from "./entities";

import { newExhaustedEnumError } from "./commonErrors";

// Recursively replace all Entity subtypes with Entity so that they can be
// replaced with just an object with an ID.
type Decircularized<T> = {
  [key in keyof T]: T[key] extends Entity
    ? Decircularized<T[key]> | Entity
    : Decircularized<T[key]>;
};

export const decircularizePropositionCompoundAtom = (
  propositionCompoundAtom: PropositionCompoundAtom
) => {
  const decircularized: Decircularized<PropositionCompoundAtom> = cloneDeep(
    propositionCompoundAtom
  );
  decircularized.entity = decircularizeProposition(
    propositionCompoundAtom.entity
  );
  return decircularized;
};

export const decircularizePropositionCompound = (
  propositionCompound: PropositionCompound
) => {
  const decircularized: Decircularized<PropositionCompound> =
    cloneDeep(propositionCompound);
  decircularized.atoms = map(
    propositionCompound.atoms,
    decircularizePropositionCompoundAtom
  );
  return decircularized;
};

export const decircularizeJustification = (
  justification: CounteredJustification
): Decircularized<CounteredJustification> => {
  const decircularized: Decircularized<CounteredJustification> =
    cloneDeep(justification);
  if (decircularized.rootTarget.id) {
    decircularized.rootTarget = { id: decircularized.rootTarget.id };
  }
  if (justification.counterJustifications) {
    decircularized.counterJustifications =
      justification.counterJustifications.map(decircularizeJustification);
  }

  if (decircularized.target.entity.id) {
    decircularized.target.entity = { id: decircularized.target.entity.id };
  }

  switch (justification.basis.type) {
    case "PROPOSITION_COMPOUND":
      {
        decircularized.basis.entity = decircularizePropositionCompound(
          justification.basis.entity
        );
      }
      break;
    case "SOURCE_EXCERPT":
    case "WRIT_QUOTE":
      // writ quotes and source excerpts can't have circular dependencies.
      break;
    default:
      return newExhaustedEnumError(justification.basis);
  }
  return decircularized;
};

export const decircularizeSourceExcerpt = (sourceExcerpt: SourceExcerpt) => {
  // Source excerpts don't reference any entities that need decircularizing
  return sourceExcerpt;
};

export const decircularizeProposition = (
  proposition: Proposition
): Decircularized<Proposition> => {
  const decircularized: Decircularized<Proposition> = cloneDeep(proposition);
  if (proposition.justifications) {
    decircularized.justifications = proposition.justifications.map(
      decircularizeJustification
    );
  }
  return decircularized;
};

export const decircularizePerspective = (perspective: Perspective) => {
  const decircularized: Decircularized<Perspective> = cloneDeep(perspective);
  decircularized.proposition = decircularizeProposition(
    perspective.proposition
  );
  return decircularized;
};
