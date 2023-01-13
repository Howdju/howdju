import cloneDeep from "lodash/cloneDeep";

import { CounteredJustification, Perspective } from "./entities";
import { Entity, Proposition, SourceExcerpt } from "./zodSchemas";

import { newExhaustedEnumError } from "./commonErrors";

// Recursively replace all Entity subtypes with Entity so that they can be
// replaced with just an object with an ID.
type Decircularized<T> = {
  [key in keyof T]: T[key] extends Entity
    ? Decircularized<T[key]> | Entity
    : Decircularized<T[key]>;
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
    case "SOURCE_EXCERPT":
    case "WRIT_QUOTE":
      // Nothing to decircularize
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
  // proposition has no circular references; proposiion.justifications should only exist on a view
  // model, and we should remove .justifications before editing it, and so it won't be submitted either.
  return proposition;
};

export const decircularizePerspective = (perspective: Perspective) => {
  return perspective;
};
