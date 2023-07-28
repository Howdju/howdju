import { Moment } from "moment";
import { z } from "zod";
import {
  MediaExcerptOut,
  SourceOut,
  UserOut,
  WritOut,
  WritQuoteOut,
} from "./apiModels";
import { newProgrammingError } from "./commonErrors";
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
  CreateMediaExcerpt,
  CreateMediaExcerptInput,
  CreateProposition,
  CreatePropositionCompound,
  CreatePropositionCompoundAtom,
  CreatePropositionCompoundInput,
  CreatePropositionInput,
  CreateSourceExcerpt,
  CreateSourceExcerptInput,
  CreateStatement,
  CreateStatementInput,
  CreateWrit,
  CreateWritInput,
  CreateWritQuote,
  CreateWritQuoteInput,
  Entity,
  CreateModel,
  Justification,
  JustificationRootTarget,
  JustificationVote,
  MediaExcerpt,
  PasswordResetRequest,
  PersistedEntity,
  PersistCreateModel,
  Persorg,
  Proposition,
  PropositionCompound,
  PropositionCompoundAtom,
  PropositionTagVote,
  RegistrationRequest,
  Source,
  SourceExcerpt,
  Statement,
  Tag,
  TagVote,
  Url,
  UrlLocator,
  User,
  Writ,
  WritQuote,
  UpdateSource,
  CreateUrl,
  MediaExcerptRef,
} from "./zodSchemas";

/**
 * A persisted justification with ref root target.
 */
export type PersistedJustificationWithRootRef = Omit<
  Persisted<Justification>,
  "rootTarget" | "rootTargetType" | "target" | "basis"
> &
  (
    | {
        rootTargetType: "PROPOSITION";
        rootTarget: EntityRef<Proposition>;
      }
    | {
        rootTargetType: "STATEMENT";
        rootTarget: EntityRef<Statement>;
      }
  ) & {
    target:
      | {
          type: "PROPOSITION";
          entity: Persisted<Proposition>;
        }
      | {
          type: "STATEMENT";
          entity: Persisted<Statement>;
        }
      | {
          type: "JUSTIFICATION";
          entity: PersistedJustificationWithRootRef;
        };
    basis:
      | {
          type: "PROPOSITION_COMPOUND";
          entity: Persisted<PropositionCompound>;
        }
      | {
          type: "MEDIA_EXCERPT";
          entity: MediaExcerptOut;
        }
      | { type: "WRIT_QUOTE"; entity: Persisted<WritQuote> };
  };

/**
 * A persisted justification with materialized basis and ref targets.
 */
export type BasedJustificationWithRootRef = Omit<
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
        // TODO(228) remove EntityRef<Justification>
        entity: BasedJustificationWithRootRef | EntityRef<Justification>;
      };
  basis:
    | {
        type: "PROPOSITION_COMPOUND";
        entity: Persisted<PropositionCompound>;
      }
    | {
        type: "MEDIA_EXCERPT";
        entity: MediaExcerptOut | MediaExcerptRef;
      }
    | { type: "SOURCE_EXCERPT"; entity: Persisted<SourceExcerpt> }
    | { type: "WRIT_QUOTE"; entity: Persisted<WritQuote> };
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
  : T extends PersistedJustificationWithRootRef
  ? "Justification"
  : T extends BasedJustificationWithRootRef
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
  : T extends Writ
  ? "Writ"
  : T extends CreateWrit
  ? "Writ"
  : T extends CreateWritInput
  ? "Writ"
  : T extends WritOut
  ? "Writ"
  : T extends WritQuote
  ? "WritQuote"
  : T extends CreateWritQuote
  ? "WritQuote"
  : T extends CreateWritQuoteInput
  ? "WritQuote"
  : T extends WritQuoteOut
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
  : T extends User
  ? "User"
  : T extends UserOut
  ? "User"
  : T extends MediaExcerpt
  ? "MediaExcerpt"
  : T extends CreateMediaExcerpt
  ? "MediaExcerpt"
  : T extends CreateMediaExcerptInput
  ? "MediaExcerpt"
  : T extends UrlLocator
  ? "UrlLocator"
  : T extends Source
  ? "Source"
  : T extends SourceOut
  ? "Source"
  : T extends UpdateSource
  ? "Source"
  : T extends CreateUrl
  ? "Url"
  : T extends Url
  ? "Url"
  : never;

/** A reference to an Entity by ID. */
export type Ref<TName extends string> = PersistedEntity & z.BRAND<TName>;
export type EntityOrRef<T extends Entity> = T | Ref<EntityName<T>>;
// If T is already a Ref, return it as-is.
export type EntityRef<T extends Entity> = T extends Ref<string>
  ? T
  : Ref<EntityName<T>>;

/** Translates a CreateModel to its corresponding Entity's name. */
type CreateModelEntityName<T extends CreateModel> = T extends CreateMediaExcerpt
  ? "MediaExcerpt"
  : never;

type CreateModelOrRef<T extends CreateModel> =
  | T
  | Ref<CreateModelEntityName<T>>;

/** Makes an Entity's ID required and all related entities can be refs. */
export type Persisted<T extends Entity> = PersistedEntity &
  EntityRef<T> &
  PersistRelated<Omit<T, "id">>;
export type PersistRelated<T> = {
  [key in keyof T]: T[key] extends Entity
    ? Persisted<T[key]>
    : T[key] extends CreateModelOrRef<infer U>
    ? PersistCreateModel<U>
    : T[key] extends Moment
    ? T[key]
    : T[key] extends object
    ? PersistRelated<T[key]>
    : T[key];
};

/** Returns a type with some of T's properties persisted. */
export type PartialPersist<T, Props extends keyof T> = Omit<T, Props> & {
  [key in Props]: T[key] extends Entity
    ? Persisted<T[key]>
    : PersistRelated<T[key]>;
};

/** A persisted entity that may be only a Ref.
 *
 * This type will definitely have an ID, but may not have other fields.
 */
export type PersistedOrRef<T extends Entity> =
  | Ref<EntityName<T>>
  | Persisted<T>;
/**
 * Recursively transforms Entities on T to PersistedOrRef.
 *
 * Prefer PersistedOrRef if you know that T is an Entity.
 */
export type PersistOrRef<T> = T extends Entity
  ? PersistedOrRef<T>
  : {
      [key in keyof T]: T[key] extends Entity
        ? PersistedOrRef<T[key]>
        : PersistOrRef<T[key]>;
    };

/**
 * Whether o is a plain Ref of type brand.
 *
 * A plain Ref has just an ID and a BRAND. If brand is provided, the BRAND must match.
 */
export function isOnlyRef<T extends string = string>(
  o: any,
  brand?: T
): o is Ref<T> {
  if (Object.keys(o).length !== 1) {
    return false;
  }
  return "id" in o && z.BRAND in o && (!brand || o[z.BRAND] === brand);
}

export function isRef<T extends Entity>(e: EntityOrRef<T>): e is EntityRef<T> {
  const keys = Object.keys(e);
  // An entity with a single property `id` is a ref.
  if (keys.length === 1 && keys[0] === "id") {
    // If we have typed everything correctly, it should have also had the Zod BRAND
    if (!(z.BRAND in e)) {
      logger.warn(`Ref lacks z.BRAND property (id: ${e.id}).`);
    }
    return true;
  }
  // Otherwise, an object with a BRAND is a Ref because we only brand Refs. (We don't brand objects
  // that can be stucturally typed.)
  // TODO(451) "we only brand Refs." is not true. We brand materialized entities elsewhere. Use isOnlyRef where we mean
  // an object having just an ID and a BRAND.
  const isBranded = z.BRAND in e;
  if (isBranded && !e.id) {
    throw newProgrammingError(
      `Ref has a BRAND but lacks an ID (BRAND: ${e[z.BRAND]}).`
    );
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

/**
 * Allows branding an object containing fields missign from the branded schema.
 *
 * ZodBranded does not provide a `passthrough` approach. This helper works around that.
 *
 * TODO(339): use this in the places where we are doing `{...BlahRef.parse({id}), ...reset}`. E.g. orm.ts
 * TODO(339): can we type `val` to be a Partial of the actual schema? Maybe pass the schema instead of
 * the brand and use EntityName to lookup the brand: `brandedParse(Justification, {id, target, ...})`
 * TODO(458) Try to make val's type `T extends z.output<S>`?
 */
export function brandedParse<
  T,
  S extends z.ZodTypeAny,
  B extends string | number | symbol
>(brandSchema: z.ZodBranded<S, B>, val: T) {
  return {
    ...val,
    ...brandSchema.parse(val),
  };
}
