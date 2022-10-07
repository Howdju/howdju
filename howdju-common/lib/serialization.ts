import { cloneDeep } from "lodash";
import {
  CounteredJustification,
  Entity,
  JustificationBasisCompoundAtom,
  JustifiedProposition,
  Perspective,
  PropositionCompound,
  PropositionCompoundAtom,
  SourceExcerpt,
  SourceExcerptParaphrase,
} from "./entities";

import forEach from "lodash/forEach"
import map from "lodash/map"

import { newExhaustedEnumError } from "./commonErrors"

// Recursively replace all Entity subtypes with Entity so that they can be
// replaced with just an object with an ID.
type Decircularized<T> = {
  [key in keyof T]:
    T[key] extends Entity ?
    Decircularized<T[key]> | Entity :
    Decircularized<T[key]>
}

export const decircularizePropositionCompoundAtom = (
  propositionCompoundAtom: PropositionCompoundAtom
) => {
  propositionCompoundAtom.entity = decircularizeProposition(
    propositionCompoundAtom.entity
  );
  return propositionCompoundAtom;
};

export const decircularizePropositionCompound = (
  propositionCompound: PropositionCompound
) => {
  propositionCompound.atoms = map(
    propositionCompound.atoms,
    decircularizePropositionCompoundAtom
  );
  return propositionCompound;
};

export const decircularizeJustification = (
  justification: CounteredJustification
): Decircularized<CounteredJustification> => {
  const decircularized: Decircularized<CounteredJustification> = cloneDeep(justification)
  if (decircularized.rootTarget.id) {
    decircularized.rootTarget = { id: decircularized.rootTarget.id };
  }
  if (justification.counterJustifications) {
    decircularized.counterJustifications = justification.counterJustifications.map(
      decircularizeJustification);
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
      // writ quotes can't have circular dependencies.  They reference writs, which are leaf entities.
      break;
    case "JUSTIFICATION_BASIS_COMPOUND":
      forEach(
        justification.basis.entity.atoms,
        decircularizeJustificationBasisCompoundAtom
      );
      break;
    default:
      throw newExhaustedEnumError(
        "JustificationBasisTypes",
        justification.basis
      );
  }
  return decircularized;
};

export const decircularizeJustificationBasisCompoundAtom = (
  atom: JustificationBasisCompoundAtom
) => {
  switch (atom.type) {
    case "PROPOSITION":
      atom.entity = decircularizeProposition(atom.entity);
      break;
    case "SOURCE_EXCERPT_PARAPHRASE":
      atom.entity = decircularizeSourceExcerptParaphrase(atom.entity);
      break;
    default:
      throw newExhaustedEnumError(
        "JustificationBasisCompoundAtomTypes",
        atom
      );
  }
  return atom;
};

export const decircularizeSourceExcerptParaphrase = (
  sourceExcerptParaphrase: SourceExcerptParaphrase
) => {
  sourceExcerptParaphrase.paraphrasingProposition =
    decircularizeProposition(
      sourceExcerptParaphrase.paraphrasingProposition
    );
  sourceExcerptParaphrase.sourceExcerpt = decircularizeSourceExcerpt(
    sourceExcerptParaphrase.sourceExcerpt
  );
  return sourceExcerptParaphrase;
};

export const decircularizeSourceExcerpt = (sourceExcerpt: SourceExcerpt) => {
  // Source excerpts don't reference any entities that need decircularizing
  return sourceExcerpt;
};

export const decircularizeProposition = (proposition: JustifiedProposition): Decircularized<JustifiedProposition> => {
  const decircularized: Decircularized<JustifiedProposition> = cloneDeep(proposition)
  if (proposition.justifications) {
    decircularized.justifications = proposition.justifications.map(
      decircularizeJustification);
  }
  return decircularized;
};

export const decircularizePerspective = (perspective: Perspective) => {
  perspective.proposition = decircularizeProposition(
    perspective.proposition
  );
  return perspective;
};
