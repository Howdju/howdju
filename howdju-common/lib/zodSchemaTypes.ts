import { SetRequired } from "type-fest";
import { z } from "zod";
import { logger } from "./logger";

import {
  CreateCounterJustification,
  CreateCounterJustificationInput,
  CreateCounterJustificationInputTarget,
  CreateCounterJustificationTarget,
  CreateJustification,
  CreateJustificationInput,
  CreateJustificationInputTarget,
  CreateJustificationTarget,
  CreateJustifiedSentence,
  CreateJustifiedSentenceInput,
  CreateProposition,
  CreatePropositionCompound,
  CreatePropositionCompoundInput,
  CreatePropositionInput,
  CreateSourceExcerpt,
  CreateSourceExcerptInput,
  CreateStatement,
  CreateStatementInput,
  Entity,
  Justification,
  Proposition,
  PropositionCompound,
  SourceExcerpt,
  Statement,
  Tag,
  WritQuote,
} from "./zodSchemas";

const EntityRef = Entity.required();
type EntityRef = z.infer<typeof EntityRef>;
/** A type lookup from the entity type to the Zod Brand string. */
export type EntityName<T> = T extends Proposition
  ? "Proposition"
  : T extends CreateProposition
  ? "Proposition"
  : T extends CreatePropositionInput
  ? "Proposition"
  : T extends Justification
  ? "Justification"
  : T extends CreateJustification
  ? "Justification"
  : T extends CreateJustificationInput
  ? "Justification"
  : T extends Statement
  ? "Statement"
  : T extends CreateStatement
  ? "Statement"
  : T extends CreateStatementInput
  ? "Statement"
  : T extends Tag
  ? "Tag"
  : T extends PropositionCompound
  ? "PropositionCompound"
  : T extends CreatePropositionCompound
  ? "PropositionCompound"
  : T extends CreatePropositionCompoundInput
  ? "PropositionCompound"
  : T extends SourceExcerpt
  ? "SourceExcerpt"
  : T extends CreateSourceExcerpt
  ? "SourceExcerpt"
  : T extends CreateSourceExcerptInput
  ? "SourceExcerpt"
  : T extends WritQuote
  ? "WritQuote"
  : never;
/** A reference to an Entity by ID. */
export type Ref<TName extends string> = EntityRef & z.BRAND<TName>;
export type EntityOrRef<T extends Entity> = T | Ref<EntityName<T>>;

export type Persisted<T extends Entity> = SetRequired<T, "id">;

export function isRef<T extends Entity>(
  e: EntityOrRef<T>
): e is Ref<EntityName<T>> {
  const keys = Object.keys(e);
  // An entity with a single property `id` is a ref.
  if (keys.length === 1 && keys[0] === "id") {
    // If we have typed everything correctly, it should have also had the Zod BRAND.
    logger.warn(`Ref lacks z.BRAND property (id: ${e.id}).`);
    return true;
  }
  // Otherwise, an object with a BRAND is a Ref because we only brand Refs. (We don't brand objects
  // that can be stucturally typed.)
  const is = z.BRAND in e;
  if (is) {
    // And if it's a Ref, it must have an ID (or else we don't know what it references.)
    console.assert(e.id);
  }
  return is;
}

/** Yields the Input version of a type. */
export type ToInput<T> = T extends CreateJustification
  ? CreateJustificationInput
  : T extends CreateCounterJustification
  ? CreateCounterJustificationInput
  : T extends CreateJustificationTarget
  ? CreateJustificationInputTarget
  : T extends CreateCounterJustificationTarget
  ? CreateCounterJustificationInputTarget
  : T extends CreateJustifiedSentence
  ? CreateJustifiedSentenceInput
  : never;
