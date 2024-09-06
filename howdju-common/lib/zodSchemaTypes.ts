import { Moment } from "moment";
import {
  AppearanceOut,
  MediaExcerptOut,
  PropositionCompoundOut,
  PropositionOut,
  SourceOut,
  StatementOut,
  UserOut,
  WritOut,
  WritQuoteOut,
} from "./apiModels";

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
  Appearance,
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
        rootTarget: PersistedEntity;
      }
    | {
        rootTargetType: "STATEMENT";
        rootTarget: PersistedEntity;
      }
  ) & {
    target:
      | {
          type: "PROPOSITION";
          entity: PropositionOut;
        }
      | {
          type: "STATEMENT";
          entity: StatementOut;
        }
      | {
          type: "JUSTIFICATION";
          entity: PersistedJustificationWithRootRef;
        };
    basis:
      | {
          type: "PROPOSITION_COMPOUND";
          entity: PropositionCompoundOut;
        }
      | {
          type: "MEDIA_EXCERPT";
          entity: MediaExcerptOut;
        }
      | { type: "WRIT_QUOTE"; entity: Persisted<WritQuote> }
      | { type: "JUSTIFICATION_BASIS_COMPOUND"; entity: PersistedEntity };
  };

/**
 * A persisted justification with materialized basis and ref targets.
 */
export type BasedJustificationWithRootRef = Omit<
  Persisted<Justification>,
  "rootTarget" | "target" | "basis"
> & {
  rootTarget: PersistedEntity;
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
        // TODO(#228) remove EntityRef<Justification>
        entity: BasedJustificationWithRootRef | PersistedEntity;
      };
  basis:
    | {
        type: "PROPOSITION_COMPOUND";
        entity: Persisted<PropositionCompound>;
      }
    | {
        type: "MEDIA_EXCERPT";
        entity: MediaExcerptOut | PersistedEntity;
      }
    | { type: "WRIT_QUOTE"; entity: Persisted<WritQuote> }
    | {
        type: "SOURCE_EXCERPT" | "JUSTIFICATION_BASIS_COMPOUND";
        entity: PersistedEntity;
      };
};

/**
 * A type lookup from the entity type to the Zod Brand string.
 *
 * This allows us to pass just the type to brand-related helpers, and to lookup the brand string.
 *
 * TODO(#524) remove this
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
  : T extends StatementOut
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
  : T extends Appearance
  ? "Appearance"
  : T extends AppearanceOut
  ? "Appearance"
  : never;

export type EntityOrRef<T extends Entity> = T | PersistedEntity;
type CreateModelOrRef<T extends CreateModel> = T | PersistedEntity;

/** Makes an Entity's ID required and all related entities can be refs. */
export type Persisted<T extends Entity> = PersistRelated<Omit<T, "id">> &
  PersistedEntity;
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

export type ToPersistedEntity<E extends Entity> = Omit<E, "id"> &
  PersistedEntity;

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
export type PersistedOrRef<T extends Entity> = PersistedEntity | Persisted<T>;
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

/** Whether o is an unbranded entity refererence. */
export function isBareRef(o: object): o is PersistedEntity {
  const keys = Object.keys(o);
  return keys.length === 1 && keys[0] === "id";
}

export function isPersisted<T extends Entity>(o: T): o is PersistedEntity & T {
  return !!o.id;
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
