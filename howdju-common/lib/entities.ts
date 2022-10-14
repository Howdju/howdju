/** Types describing fundamental concepts in our domain. */

import {
  JustificationPolarity,
  JustificationRootPolarity,
  JustificationRootTargetType,
  SentenceType,
} from "./enums";

/** The value of an entity's `id` property. */
export type EntityId = string;

/** A perstisent conceptual entity */
export type Entity = {
  // Entities have an ID after they have been persisted.
  id?: EntityId;
};

export interface Writ extends Entity {
  title: string;
}

/** A SourceExcerpt excerpting a quote from a written Source. */
export interface WritQuote extends Entity {
  quoteText: string;
  writ: Writ;
  urls: Array<Url>;
}

export interface PicRegion extends Entity {
  pic: Entity
}
export interface VidSegment extends Entity {
  vid: Entity
}

/** A uniform resource locator */
export interface Url extends Entity {
  url: string;
  target?: UrlTarget
}

export interface UrlTarget extends Entity {
  anchors: UrlTargetAnchor[]
}

export type UrlTargetAnchor = UrlTargetAnchor_TextQuote

export type UrlTargetAnchor_TextQuote = {
  type: "TEXT_QUOTE"
  exactText: string
  prefixText: string
  suffixText: string
  startOffset: string
  endOffset: string
}

export interface Proposition extends Entity {
  text: string;
  justifications?: Justification[]
}

export type Sentence = Statement | Proposition;

export interface Persorg extends Entity {
  isOrganization: boolean
  name: string
  knownFor: string
  websiteUrl?: string
  twitterUrl?: string
  wikipediaUrl?: string
}

export interface Statement extends Entity {
  sentence: Sentence;
  sentenceType: SentenceType
  speaker: Persorg;
}

/** A part of some fixed media. */
export type SourceExcerpt = WritQuoteSourceExcerpt | PicRegionSourceExcerpt | VidSegmentSourceExcerpt
export interface WritQuoteSourceExcerpt extends Entity {
  type: "WRIT_QUOTE"
  entity: WritQuote
}
export interface PicRegionSourceExcerpt extends Entity {
  type: "PIC_REGION"
  entity: PicRegion
}
export interface VidSegmentSourceExcerpt extends Entity {
  type: "VID_SEGMENT"
  entity: VidSegment
}

export interface PropositionCompoundAtom extends Entity {
  compoundId?: EntityId
  entity: Proposition;
}

export interface PropositionCompound extends Entity{
  atoms: PropositionCompoundAtom[];
}

/** @deprecated Use {@link PropositionAppearance} instead. */
export interface SourceExcerptParaphrase extends Entity {
  paraphrasingProposition: Proposition;
  sourceExcerpt: SourceExcerpt;
}

interface PropositionJustificationTarget {
  type: "PROPOSITION";
  entity: Proposition;
}
interface StatementJustificationTarget {
  type: "STATEMENT";
  entity: Statement;
}
interface JustificationJustificationTarget {
  type: "JUSTIFICATION";
  entity: Justification;
}
export type JustificationTarget =
  | PropositionJustificationTarget
  | StatementJustificationTarget
  | JustificationJustificationTarget;

interface PropositionCompoundJustificationBasis {
  type: "PROPOSITION_COMPOUND";
  entity: PropositionCompound;
}
interface SourceExcerptJustificationBasis {
  type: "SOURCE_EXCERPT";
  entity: SourceExcerpt;
}

/** @deprecated Use {@link SourceExcerptJustificationBasis} instead. */
interface WritQuoteJustificationBasis {
  type: "WRIT_QUOTE";
  entity: WritQuote;
}

export type JustificationBasis =
  | PropositionCompoundJustificationBasis
  | SourceExcerptJustificationBasis
  | WritQuoteJustificationBasis;

export type JustificationRootTarget = Proposition | Statement

export interface Justification extends Entity {
  target: JustificationTarget;
  polarity: JustificationPolarity;
  basis: JustificationBasis;
  rootTargetType: JustificationRootTargetType;
  rootTarget: JustificationRootTarget;
  rootPolarity: JustificationRootPolarity;
}

export interface CounteredJustification extends Justification {
  counterJustifications?: Justification[];
}

export interface Perspective extends Entity {
  proposition: Proposition;
}

export interface Tag extends Entity {
  name: string
}

export interface PropositionTagVote {}

/**
 * An Entity that has been persisted.
 *
 * After an entity has been persisted, it will have an ID. Whenever the entity
 * is read, it should have its ID. Its other attributes are typed as optional,
 * since technically they are implied by the ID. If other attributes must be
 * present for a particular use-case, then they can be added like:
 *
 * ```
 * Persisted<Justification> & Pick<Justification, "rootTargetType" | "rootTarget" | ...>
 * ```
 *
 * or to make them required even if they are not normally required for the entity:
 *
 * ```
 * Persisted<Justification> & Required<Pick<Justification, "rootTargetType" | "rootTarget" | ...>>
 * ```
 */
type PersistedEntity<T extends Entity> = Required<Pick<T, 'id'>> & Partial<T>
/** A type that contains Persisted entities.
 *
 * The top-most entities in any path from the root type will be required entites.
 * Within those top-most entities, their sub-fields are optional (they are
 * implied by the `id`) but if they are entities, they must also be persisted.
 */
export type Persisted<T> = T extends Entity ?
  // If the top-level type is an Entity, then it must be persisted.
  PersistedEntity<T> & {
    // Other fields become optional (`+?`) because the PersistedEntity implies
    // their value.
    [key in keyof T]+?:
      T[key] extends Entity ?
        // If they are entites, then they must be persisted, too.
        PersistedEntity<T[key]> :
        T[key]
  } :
  // If the top-level type is not an entity...
  T & {
    // then just recurse on its keys. The first entities found this way will be
    // required and persisted.
    [key in keyof T]: Persisted<T[key]>
  }

/**  */
export type EntityReference<T extends Entity> = Required<Pick<T, 'id'>> & Partial<T>
