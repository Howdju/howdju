import { SetRequired } from "type-fest";
import { z } from "zod";

import {
  CreateJustification,
  CreateJustificationInput,
  CreateProposition,
  CreatePropositionCompoundInput,
  CreatePropositionInput,
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
  : T extends CreatePropositionCompoundInput
  ? "PropositionCompound"
  : T extends SourceExcerpt
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
  return keys.length === 1 && keys[0] === "id";
}
