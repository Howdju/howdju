import { Moment } from "moment";
import { z } from "zod";
import { assert } from "./general";
import { logger } from "./logger";

import {
  AccountSettings,
  ContentReport,
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
  CreatePropositionCompoundAtom,
  CreatePropositionCompoundInput,
  CreatePropositionInput,
  CreateSourceExcerpt,
  CreateSourceExcerptInput,
  CreateStatement,
  CreateStatementInput,
  CreateWritQuote,
  CreateWritQuoteInput,
  Entity,
  Justification,
  JustificationRootTarget,
  JustificationVote,
  PasswordResetRequest,
  Persorg,
  Proposition,
  PropositionCompound,
  PropositionCompoundAtom,
  PropositionTagVote,
  RegistrationRequest,
  SourceExcerpt,
  Statement,
  Tag,
  TagVote,
  User,
  WritQuote,
} from "./zodSchemas";

const PersistedEntity = Entity.required();
type PersistedEntity = z.infer<typeof PersistedEntity>;

export type JustificationWithRootRef = Omit<
  Persisted<Justification>,
  "rootTarget" | "target" | "basis"
> & {
  rootTarget: EntityRef<JustificationRootTarget>;
  target:
    | {
        type: "PROPOSITION";
        entity: PersistedOrRef<Proposition>;
      }
    | {
        type: "STATEMENT";
        entity: PersistedOrRef<Statement>;
      }
    | {
        type: "JUSTIFICATION";
        entity: JustificationWithRootRef | Ref<EntityName<Justification>>;
      };
  basis:
    | {
        type: "PROPOSITION_COMPOUND";
        entity: PersistedOrRef<PropositionCompound>;
      }
    | { type: "SOURCE_EXCERPT"; entity: PersistedOrRef<SourceExcerpt> }
    | { type: "WRIT_QUOTE"; entity: PersistedOrRef<WritQuote> };
};

/**
 * A type lookup from the entity type to the Zod Brand string.
 *
 * This allows us to pass just the type to brand-related helpers, and to lookup the brand string.
 */
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
  : T extends JustificationWithRootRef
  ? "Justification"
  : T extends JustificationVote
  ? "JustificationVote"
  : T extends Statement
  ? "Statement"
  : T extends CreateStatement
  ? "Statement"
  : T extends CreateStatementInput
  ? "Statement"
  : T extends Persorg
  ? "Persorg"
  : T extends Tag
  ? "Tag"
  : T extends TagVote
  ? "TagVote"
  : T extends PropositionCompoundAtom
  ? "PropositionCompoundAtom"
  : T extends CreatePropositionCompoundAtom
  ? "PropositionCompoundAtom"
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
  : T extends CreateWritQuote
  ? "WritQuote"
  : T extends CreateWritQuoteInput
  ? "WritQuote"
  : T extends User
  ? "User"
  : T extends PropositionTagVote
  ? "PropositionTagVote"
  : T extends RegistrationRequest
  ? "RegistrationRequest"
  : T extends PasswordResetRequest
  ? "PasswordResetRequest"
  : T extends AccountSettings
  ? "AccountSettings"
  : T extends ContentReport
  ? "ContentReport"
  : never;

/** A reference to an Entity by ID. */
export type Ref<TName extends string> = PersistedEntity & z.BRAND<TName>;
export type EntityOrRef<T extends Entity> = T | Ref<EntityName<T>>;
// If T is already a Ref, return it as-is.
export type EntityRef<T extends Entity> = T extends Ref<string>
  ? T
  : Ref<EntityName<T>>;

/** Makes an Entity's ID required and all related entities can be refs. */
export type Persisted<T extends Entity> = {
  id: string;
} & EntityRef<T> &
  PersistRelated<Omit<T, "id">>;
export type PersistRelated<T> = {
  [key in keyof T]: T[key] extends Entity
    ? Persisted<T[key]>
    : T[key] extends Moment
    ? T[key]
    : T[key] extends object
    ? PersistRelated<T[key]>
    : T[key];
};

export type PersistedOrRef<T extends Entity> =
  | Ref<EntityName<T>>
  | Persisted<T>;

export function isRef<T extends Entity>(e: EntityOrRef<T>): e is EntityRef<T> {
  const keys = Object.keys(e);
  // An entity with a single property `id` is a ref.
  if (keys.length === 1 && keys[0] === "id") {
    // If we have typed everything correctly, it should have also had the Zod BRAND, which it
    // doesn't because it has just one key.
    logger.warn(`Ref lacks z.BRAND property (id: ${e.id}).`);
    return true;
  }
  // Otherwise, an object with a BRAND is a Ref because we only brand Refs. (We don't brand objects
  // that can be stucturally typed.)
  const isBranded = z.BRAND in e;
  if (isBranded) {
    // And if it's a Ref, it must have an ID (or else we don't know what it references.)
    assert(keys.length === 2);
    assert(!!e.id);
  }
  // Technically we don't know that the object is branded as a T; we must rely on the typesystem,
  // and that a programmer hasn't overridden the typesystem incorrectly.
  return isBranded;
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
