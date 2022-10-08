import {
  JustificationPolarityType,
  JustificationRootPolarityType,
  JustificationRootTargetType,
} from "./enums";
import { OneOf } from "./typeUtils";

/** The value of an entity's `id` property. */
export type EntityId = string;

/** A perstisent conceptual entity */
export type Entity = {
  // Entities have an ID after they have been persisted.
  id?: EntityId;
};

/** A SourceExcerpt excerpting a quote from a written Source. */
export interface WritQuote extends Entity {
  quoteText: string;
  writ: {
    title: string;
  };
  urls: Array<Url>;
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

export interface PicRegion extends Entity {}
export interface VidSegment extends Entity {}

export type SourceExcerpt = Entity & {
  // Add common properties here
} & OneOf<{
    writQuote: WritQuote;
    picRegion: PicRegion;
    vidSegment: VidSegment;
  }>;

export interface PropositionCompoundAtom {
  entity: Proposition;
}

export interface PropositionCompound {
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
export interface JustificationBasisCompoundAtomProposition {
  type: "PROPOSITION";
  entity: Proposition;
}

/** @deprecated */
export interface JustificationBasisCompoundAtomSourceExcerptParaphrase {
  type: "SOURCE_EXCERPT_PARAPHRASE"
  entity: SourceExcerptParaphrase
}

/** @deprecated */
export interface JustificationBasisCompound {
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
  polarity: JustificationPolarityType;
  basis: JustificationBasis;
  rootTarget: JustificationRootTarget;
  rootTargetType: JustificationRootTargetType;
  rootPolarity: JustificationRootPolarityType;
}

export interface CounteredJustification extends Justification {
  counterJustifications?: Justification[];
}

export interface Perspective extends Entity {
  proposition: Proposition;
}

export interface Tag extends Entity {}
