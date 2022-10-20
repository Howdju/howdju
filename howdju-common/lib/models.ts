import assign from "lodash/assign";
import merge from "lodash/merge";
import asString from "lodash/toString";

import { newImpossibleError, newExhaustedEnumError } from "./commonErrors";
import {
  EntityId,
  Justification,
  Persisted,
  Persorg,
  PicRegion,
  Proposition,
  PropositionCompound,
  PropositionCompoundAtom,
  PropositionTagVote,
  PropositionTagVoteSubmissionModel,
  Sentence,
  SourceExcerpt,
  Statement,
  Tag,
  Url,
  VidSegment,
  Writ,
  WritQuote,
} from "./entities";
import {
  JustificationPolarities,
  JustificationRootPolarities,
  JustificationVotePolarities,
  JustificationBasisTypes,
  JustificationTargetTypes,
  JustificationVotePolarity,
  JustificationRootPolarity,
  SentenceType,
  SourceExcerptTypes,
  PropositionTagVotePolarities,
} from "./enums";
import { isDefined } from "./general";

export const isPositive = (j: Justification) =>
  j.polarity === JustificationPolarities.POSITIVE;
export const isNegative = (j: Justification) =>
  j.polarity === JustificationPolarities.NEGATIVE;
export const isRootPositive = (j: Justification) =>
  j.rootPolarity === JustificationRootPolarities.POSITIVE;
export const isRootNegative = (j: Justification) =>
  j.rootPolarity === JustificationRootPolarities.NEGATIVE;
// If a justification targets another justification, its polarity should always be negative
export const isCounter = (j: Justification) =>
  j.target.type === JustificationTargetTypes.JUSTIFICATION && isNegative(j);
export const isRootJustification = (j: Justification) =>
  j.target.type === j.rootTargetType && j.target.entity.id === j.rootTarget.id;
export const hasQuote = (j: Justification) =>
  j.basis.type === JustificationBasisTypes.WRIT_QUOTE &&
  j.basis.entity.quoteText;
export const isPropositionCompoundBased = (j: Justification) =>
  j ? j.basis.type === JustificationBasisTypes.PROPOSITION_COMPOUND : false;
export const isWritQuoteBased = (j: Justification) =>
  j ? j.basis.type === JustificationBasisTypes.WRIT_QUOTE : false;

export const negateJustificationVotePolarity = (
  polarity: JustificationVotePolarity
) => {
  switch (polarity) {
    case JustificationVotePolarities.POSITIVE:
      return JustificationVotePolarities.NEGATIVE;
    case JustificationVotePolarities.NEGATIVE:
      return JustificationVotePolarities.POSITIVE;
    default:
      throw newExhaustedEnumError(polarity);
  }
};

export const negateRootPolarity = (rootPolarity: JustificationRootPolarity) => {
  switch (rootPolarity) {
    case JustificationRootPolarities.POSITIVE:
      return JustificationRootPolarities.NEGATIVE;
    case JustificationRootPolarities.NEGATIVE:
      return JustificationRootPolarities.POSITIVE;
    default:
      throw newImpossibleError(rootPolarity);
  }
};

export interface Credentials {
  email: string;
  password: string;
}

export const makeCredentials = (props?: Partial<Credentials>): Credentials =>
  assign({ email: "", password: "" }, props);

export interface RegistrationRequest {
  email: string;
}

export const makeRegistrationRequest = (
  props?: Partial<RegistrationRequest>
): RegistrationRequest =>
  assign(
    {
      email: "",
    },
    props
  );

export interface RegistrationConfirmation {
  registrationCode: string;
  username: string;
  shortName: string;
  longName: string;
  password: string;
  doesAcceptTerms: boolean;
}
export const makeRegistrationConfirmation = (
  props?: Partial<RegistrationConfirmation>
): RegistrationConfirmation =>
  assign(
    {
      registrationCode: "",
      username: "",
      shortName: "",
      longName: "",
      password: "",
      doesAcceptTerms: false,
    },
    props
  );

export interface User {
  email: string;
  username: string;
  shortName: string;
  longName: string;
  acceptedTerms: boolean;
  affirmedMajorityConsent: boolean;
  affirmed13YearsOrOlder: boolean;
  affirmedNotGdpr: boolean;
  isActive: boolean;
}

export const makeUser = (props?: Partial<User>): User =>
  assign(
    {
      email: "",
      username: "",
      shortName: "",
      longName: "",
      acceptedTerms: null,
      affirmedMajorityConsent: null,
      affirmed13YearsOrOlder: null,
      affirmedNotGdpr: null,
      isActive: false,
    },
    props
  );

export interface AccountSettings {
  paidContributionsDisclosure: string;
}

export const makeAccountSettings = (
  props?: Partial<AccountSettings>
): AccountSettings =>
  assign(
    {
      paidContributionsDisclosure: "",
    },
    props
  );

export const makeProposition = (props?: Partial<Proposition>): Proposition =>
  assign({ text: "" }, props);

export const makeStatement = (
  speaker: Persorg,
  sentenceType: SentenceType,
  sentence: Sentence
): Statement => ({
  speaker,
  sentenceType,
  sentence,
});

export const makeSourceExcerptJustification = (
  props?: Partial<Justification>
): Justification => {
  const init = {
    target: null,
    basis: {
      type: JustificationBasisTypes.WRIT_QUOTE,
      entity: null,
    },
  };
  const merged = merge(init, props);
  return merged;
};

export const makeWrit = (props?: Partial<Writ>): Writ =>
  merge(
    {
      title: "",
    },
    props
  );

export const makeWritQuote = (props?: Partial<WritQuote>): WritQuote =>
  merge(
    {
      writ: makeWrit(),
      quoteText: "",
      urls: [makeUrl()],
    },
    props
  );

export const makePropositionCompound = (
  props?: Partial<PropositionCompound>
): PropositionCompound => assign({ atoms: [makePropositionAtom()] }, props);

export const makePropositionAtom = (
  props?: Partial<PropositionCompoundAtom>
): PropositionCompoundAtom => assign({ entity: makeProposition() }, props);

export const makePropositionCompoundFromProposition = (
  proposition: Proposition
): PropositionCompound =>
  makePropositionCompound({
    atoms: [makePropositionAtom({ entity: proposition })],
  });

export const makePropositionCompoundAtomFromProposition = (
  proposition: Proposition
) => ({
  entity: proposition,
});

export const makeUrl = (props?: Partial<Url>): Url => merge({ url: "" }, props);

export const makePersorg = (): Persorg => ({
  isOrganization: false,
  name: "",
  knownFor: "",
  websiteUrl: undefined,
  twitterUrl: undefined,
  wikipediaUrl: undefined,
});

/**
 * Compare two entity IDs for equality
 *
 * If the ID came from the database, it may be an integer.  So convert both to string before doing strict equality.
 * The orm mappers and dao methods (in the case of a dao method returning a bare ID) are responsible for converting IDs
 * to strings.  But because this comparison is so important, it is worthwile having a special method to ensure that
 * there is no mistake.  One thing we don't do is convert an integer identifier from the client into a string, e.g..
 */
export const idEqual = (id1?: EntityId, id2?: EntityId) =>
  isDefined(id1) && isDefined(id2) && asString(id1) === asString(id2);

export const makeTag = (props: Partial<Tag>): Tag =>
  merge(
    {
      name: "",
    },
    props
  );

export const tagEqual = (tag1: Tag, tag2: Tag) =>
  idEqual(tag1.id, tag2.id) ||
  (isDefined(tag1.name) && tag1.name === tag2.name);


/** Make some fields required and the rest optional. */
export type RequireSome<T, Fields extends keyof T> = Partial<T> & Required<Pick<T, Fields>>

/** Transform a type to represent a submission model. */
export type SubmissionModel<T, RequiredFields extends keyof T, RelatedFields extends keyof T> = T &
  Required<Pick<T, RequiredFields>> & {
  [key in RelatedFields]: Persisted<T[key]>
}

/**
 * Transform a type to represent an input to a submission model factory.
 *
 * Fields that are not required or related must provide defaults in the factory
 * if necessary to satisfy the base type.
 */
export type FactoryInput<T, RequiredFields extends keyof T, RelatedFields extends keyof T> =
  Partial<Omit<T, RequiredFields | RelatedFields>> &
  Required<Pick<T, RequiredFields>> &
  { [key in RelatedFields]: Persisted<T[key]> }

export const makePropositionTagVote = (
  props: RequireSome<PropositionTagVote, "tag" | "proposition">
): PropositionTagVote => merge({
  polarity: PropositionTagVotePolarities.POSITIVE,
}, props);

export const makePropositionTagVoteSubmissionModel = (
  props: FactoryInput<PropositionTagVote, "tag", "proposition">
): PropositionTagVoteSubmissionModel => merge({
  polarity: PropositionTagVotePolarities.POSITIVE,
}, props);

export const doTargetSameRoot = (j1: Justification, j2: Justification) =>
  idEqual(j1.rootTarget.id, j2.rootTarget.id) &&
  j1.rootTargetType === j2.rootTargetType;

export const makeNewAccountSettings = () => ({});

export function makeVidSegment(): VidSegment {
  return {vid: {}}
}

export function makePicRegion(): PicRegion {
  return {pic: {}}
}

export const makeSourceExcerpt = (
  props?: Partial<SourceExcerpt>
): SourceExcerpt =>
  merge({
    type: SourceExcerptTypes.WRIT_QUOTE,
    entity: makeWritQuote(),
  }, props);
