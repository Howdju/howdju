import {
  JustificationPolarity,
  JustificationRootPolarity,
  JustificationRootTargetType,
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
}

export class Url {
  url: string
  constructor(url: string) {
    this.url = url
  }
}

export interface Proposition extends Entity {
  text: string;
}

export type Sentence = Statement | Proposition;

export interface Persorg extends Entity {}

export interface Statement extends Entity {
  sentence: Sentence;
  speaker: Persorg;
}

/**
 * A version of SourcExcerpt that uses discriminated union to distinguish the SourcExcerpt type.
 *
 * viewModels.removeSourceExcerptParaphraseIds uses these, whereas
 * models.translateNewSourceExcerptEntity supports either this or {@link SourceExcerptViewModel}
 */
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

export interface PropositionCompoundAtom {
  compoundId?: EntityId
  entity: Proposition;
}

export interface PropositionCompound extends Entity{
  atoms: PropositionCompoundAtom[];
}

/** @deprecated */
export type JustificationBasisCompoundAtomEntity = SourceExcerpt | Proposition;

/** @deprecated */
export type JustificationBasisCompoundAtom = (
  JustificationBasisCompoundAtomProposition |
  JustificationBasisCompoundAtomSourceExcerptParaphrase
)

/** @deprecated */
export interface JustificationBasisCompoundAtomProposition extends Entity {
  type: "PROPOSITION";
  compoundId?: EntityId
  entity: Proposition;
}

/** @deprecated */
export interface JustificationBasisCompoundAtomSourceExcerptParaphrase extends Entity {
  type: "SOURCE_EXCERPT_PARAPHRASE"
  compoundId?: EntityId
  entity: SourceExcerptParaphrase
}

/** @deprecated */
export interface JustificationBasisCompound extends Entity {
  atoms: JustificationBasisCompoundAtom[];
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

/**
 * @deprecated Use {@link SourceExcerptJustificationBasis} or
 *   {@link PropositionCompoundJustificationBasis} */
interface JustificationBasisCompoundJustificationBasis {
  type: "JUSTIFICATION_BASIS_COMPOUND";
  entity: JustificationBasisCompound;
}
export type JustificationBasis =
  | PropositionCompoundJustificationBasis
  | SourceExcerptJustificationBasis
  | JustificationBasisCompoundJustificationBasis;

/** A view model for the JustificationsPage and also an API type, I think. */
export interface JustifiedProposition extends Proposition {
  justifications?: Justification[];
}

export type JustificationRootTarget = Proposition | Statement

export interface Justification extends Entity {
  target: JustificationTarget;
  polarity: JustificationPolarity;
  basis: JustificationBasis;
  rootTarget: JustificationRootTarget;
  rootTargetType: JustificationRootTargetType;
  rootPolarity: JustificationRootPolarity;
}

export interface CounteredJustification extends Justification {
  counterJustifications?: Justification[];
}

export interface Perspective extends Entity {
  proposition: Proposition;
}

export interface Tag extends Entity {}
