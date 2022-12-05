import assign from "lodash/assign";
import merge from "lodash/merge";
import asString from "lodash/toString";

import { newImpossibleError, newExhaustedEnumError } from "./commonErrors";
import { EntityId } from "./entities";
import { isDefined } from "./general";
import {
  CreateJustification,
  CreateJustificationInput,
  CreatePropositionCompoundAtomInput,
  Entity,
  Justification,
  JustificationRootPolarity,
  JustificationRootTargetType,
  JustificationVotePolarity,
  Persorg,
  PicRegion,
  Proposition,
  PropositionCompound,
  PropositionCompoundAtom,
  PropositionTagVote,
  SourceExcerpt,
  Statement,
  Tag,
  TagVote,
  Url,
  VidSegment,
  Writ,
  WritQuote,
} from "./zodSchemas";
import { EntityName, EntityOrRef, isRef, Ref } from "./zodSchemaTypes";

export const isPositive = (j: Justification) => j.polarity === "POSITIVE";
export const isNegative = (j: Justification) => j.polarity === "NEGATIVE";
export const isRootPositive = (j: Justification) =>
  j.rootPolarity === "POSITIVE";
export const isRootNegative = (j: Justification) =>
  j.rootPolarity === "NEGATIVE";
// If a justification targets another justification, its polarity should always be negative
export const isCounter = (j: Justification) =>
  j.target.type === "JUSTIFICATION" && isNegative(j);
export const isRootJustification = (j: Justification) =>
  j.target.type === j.rootTargetType && j.target.entity.id === j.rootTarget.id;
export const hasQuote = (j: Justification) =>
  j.basis.type === "WRIT_QUOTE" && j.basis.entity.quoteText;
export const isPropositionCompoundBased = (
  j: Justification | CreateJustification | CreateJustificationInput
) => (j ? j.basis.type === "PROPOSITION_COMPOUND" : false);
export const isWritQuoteBased = (
  j: Justification | CreateJustification | CreateJustificationInput
) => (j ? j.basis.type === "WRIT_QUOTE" : false);

export const negateJustificationVotePolarity = (
  polarity: JustificationVotePolarity
) => {
  switch (polarity) {
    case "POSITIVE":
      return "NEGATIVE";
    case "NEGATIVE":
      return "POSITIVE";
    default:
      throw newExhaustedEnumError(polarity);
  }
};

export const negateRootPolarity = (rootPolarity: JustificationRootPolarity) => {
  switch (rootPolarity) {
    case "POSITIVE":
      return "NEGATIVE";
    case "NEGATIVE":
      return "POSITIVE";
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
  is13YearsOrOlder: boolean;
  hasMajorityConsent: boolean;
  isNotGdpr: boolean;
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
      is13YearsOrOlder: false,
      hasMajorityConsent: false,
      isNotGdpr: false,
    },
    props
  );

export interface UserRegistration {
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

export const makeUserRegistration = (
  props?: Partial<UserRegistration>
): UserRegistration =>
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

interface AccountSettings {
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

export const makeStatement = (props?: Partial<Statement>): Statement =>
  merge(
    {
      speaker: makePersorg(),
      sentenceType: "PROPOSITION",
      sentence: makeProposition(),
    },
    props
  );

export const makeSourceExcerptJustification = (
  props?: Partial<Justification>
): Justification => {
  const init = {
    target: null,
    basis: {
      type: "WRIT_QUOTE",
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
): PropositionCompound =>
  assign({ atoms: [makePropositionCompoundAtom()] }, props);

export const makePropositionCompoundFromProposition = (
  proposition: Proposition
): PropositionCompound =>
  makePropositionCompound({
    atoms: [makePropositionCompoundAtomFromProposition(proposition)],
  });

export const makePropositionCompoundAtomFromProposition = (
  proposition: Proposition
): PropositionCompoundAtom => ({
  entity: proposition,
});

export const makePropositionCompoundAtom = (
  props?: Partial<PropositionCompoundAtom>
): PropositionCompoundAtom => assign({ entity: makeProposition() }, props);

export const makeCreatePropositionCompoundAtomInput = (
  props?: Partial<CreatePropositionCompoundAtomInput>
): CreatePropositionCompoundAtomInput =>
  assign({ entity: makeCreatePropositionCompoundAtomInput() }, props);

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

export const tagEqual = (tag1: EntityOrRef<Tag>, tag2: EntityOrRef<Tag>) => {
  if (idEqual(tag1.id, tag2.id)) {
    return true;
  }
  if (isRef(tag1) || isRef(tag2)) {
    // If their IDs were unequal, and either is a ref, then they cannot be equal.
    return false;
  }
  return isDefined(tag1.name) && tag1.name === tag2.name;
};

/**
 * Transform a type to represent an input to a submission model factory.
 *
 * Fields that are not required or related must provide defaults in the factory
 * if necessary to satisfy the base type.
 */
export type FactoryInput<
  T,
  RequiredFields extends keyof T,
  RelatedFields extends keyof T
> = Partial<Omit<T, RequiredFields | RelatedFields>> &
  Required<Pick<T, RequiredFields>> & {
    // The related field can be persisted or not. If it is not persisted, it will
    // be deduplicated on the API with an equivalent entity.
    [key in RelatedFields]: T[key] extends Entity
      ? T[key] | Ref<EntityName<T[key]>>
      : T[key];
  };

export const makePropositionTagVote = (
  props: FactoryInput<PropositionTagVote, never, "proposition" | "tag">
): PropositionTagVote =>
  merge(
    {
      polarity: "POSITIVE",
    },
    props
  );

export const makeCreatePropositionTagVote = makePropositionTagVote;

export const makeTagVote = (
  props: FactoryInput<TagVote, "targetType", "target" | "tag">
): TagVote =>
  merge(
    {
      polarity: "POSITIVE",
    },
    props
  );
export const makeCreateTagVote = makeTagVote;

export const doTargetSameRoot = (j1: Justification, j2: Justification) =>
  idEqual(j1.rootTarget.id, j2.rootTarget.id) &&
  j1.rootTargetType === j2.rootTargetType;

export const makeNewAccountSettings = () => ({});

export function makeVidSegment(): VidSegment {
  return { vid: {} };
}

export function makePicRegion(): PicRegion {
  return { pic: {} };
}

export const makeSourceExcerpt = (
  props?: Partial<SourceExcerpt>
): SourceExcerpt =>
  merge(
    {
      type: "WRIT_QUOTE",
      entity: makeWritQuote(),
    },
    props
  );

export interface JustificationRootTargetInfo {
  rootTargetType: JustificationRootTargetType;
  rootTargetId: EntityId;
}
