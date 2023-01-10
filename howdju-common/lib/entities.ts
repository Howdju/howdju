/** Types describing fundamental concepts in our domain. */

import {
  JustificationPolarity,
  JustificationRootPolarity,
  JustificationRootTargetType,
  SentenceType,
} from "./zodSchemas";

/** The value of an entity's `id` property. */
export type EntityId = string;

/** A perstisent conceptual entity */
type Entity = {
  // Entities have an ID after they have been persisted.
  id?: EntityId;
};

interface Writ extends Entity {
  title: string;
}

/** A SourceExcerpt excerpting a quote from a written Source. */
interface WritQuote extends Entity {
  quoteText: string;
  writ: Writ;
  urls: Array<Url>;
}

type Pic = Entity;

interface PicRegion extends Entity {
  pic: Pic;
}

type Vid = Entity;

interface VidSegment extends Entity {
  vid: Vid;
}

/** A uniform resource locator */
interface Url extends Entity {
  url: string;
  target?: UrlTarget;
}

interface UrlTarget extends Entity {
  anchors: UrlTargetAnchor[];
}

type UrlTargetAnchor = UrlTargetAnchor_TextQuote;

type UrlTargetAnchor_TextQuote = {
  type: "TEXT_QUOTE";
  exactText: string;
  prefixText: string;
  suffixText: string;
  startOffset: number;
  endOffset: number;
};

interface Proposition extends Entity {
  text: string;
  justifications?: Justification[];
}

type Sentence = Statement | Proposition;

interface Persorg extends Entity {
  isOrganization: boolean;
  name: string;
  knownFor: string;
  websiteUrl?: string;
  twitterUrl?: string;
  wikipediaUrl?: string;
}

interface Statement extends Entity {
  sentence: Sentence;
  sentenceType: SentenceType;
  speaker: Persorg;
}

/** A part of some fixed media. */
type SourceExcerpt =
  | WritQuoteSourceExcerpt
  | PicRegionSourceExcerpt
  | VidSegmentSourceExcerpt;
interface WritQuoteSourceExcerpt extends Entity {
  type: "WRIT_QUOTE";
  entity: WritQuote;
}
interface PicRegionSourceExcerpt extends Entity {
  type: "PIC_REGION";
  entity: PicRegion;
}
interface VidSegmentSourceExcerpt extends Entity {
  type: "VID_SEGMENT";
  entity: VidSegment;
}

interface PropositionCompoundAtom extends Entity {
  compoundId?: EntityId;
  entity: Proposition;
}

interface PropositionCompound extends Entity {
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
type JustificationTarget =
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

type JustificationBasis =
  | PropositionCompoundJustificationBasis
  | SourceExcerptJustificationBasis
  | WritQuoteJustificationBasis;

type JustificationRootTarget = Proposition | Statement;

interface Justification extends Entity {
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

/**
 * An opaque pagination token from the API.
 *
 * Encodes sorting, offset, etc. */
export type ContinuationToken = string;

/**
 *  A token authorizing clients to take actions as users.
 *
 * Clients must keep this secret, they must expire them before too long, and
 * we must enforce the expirations server-side.
 */
export type AuthToken = string;

/**
 * A timestamp .
 *
 * I think this is an ISO 8601 datetime format
 *
 * Example: 2022-11-25T17:43:19.876Z */
export type DatetimeString = string;
