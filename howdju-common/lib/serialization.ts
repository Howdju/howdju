import { cloneDeep } from "lodash";
import { isMoment } from "moment";

import { JustificationOut, JustificationWithRootOut } from "./apiModels";
import { mapValuesDeep } from "./general";
import { JustificationView } from "./viewModels";
import { Entity, Proposition, SourceExcerpt } from "./zodSchemas";

// Recursively replace all Entity subtypes with Entity so that they can be
// replaced with just an object with an ID.
export type Decircularized<T> = {
  [key in keyof T]: T[key] extends Entity
    ? Decircularized<T[key]> | Entity
    : Decircularized<T[key]>;
};

export function domSerializationSafe(obj: any) {
  return mapValuesDeep(obj, (value) => {
    if (isMoment(value)) {
      return value.toISOString();
    }
    return value;
  });
}

export function decircularizeJustification(
  justification: JustificationOut | JustificationWithRootOut | JustificationView
): Decircularized<JustificationOut> {
  const decircularized: Decircularized<JustificationOut> =
    cloneDeep(justification);
  if (decircularized.rootTarget.id) {
    decircularized.rootTarget = { id: decircularized.rootTarget.id };
  }
  if (justification.counterJustifications) {
    decircularized.counterJustifications =
      justification.counterJustifications.map((j) =>
        "counterJustifications" in j ? decircularizeJustification(j) : j
      );
  }

  if (decircularized.target.entity.id) {
    decircularized.target.entity = { id: decircularized.target.entity.id };
  }

  return decircularized;
}

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
