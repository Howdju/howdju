import assign from "lodash/assign";
import map from "lodash/map";
import merge from "lodash/merge";
import asString from "lodash/toString";

import { newImpossibleError, newExhaustedEnumError } from "./commonErrors";
import { Justification } from "./entities";
import {
  JustificationPolarities,
  JustificationRootPolarities,
  JustificationVotePolarities,
  JustificationBasisTypes,
  JustificationTargetTypes,
  JustificationBasisCompoundAtomTypes,
  SourceExcerptTypes,
  JustificationVotePolarity,
  JustificationRootPolarity,
} from "./enums";
import { isDefined } from "./general";

export const isPositive = (j: Justification) => j.polarity === JustificationPolarities.POSITIVE;
export const isNegative = (j: Justification) => j.polarity === JustificationPolarities.NEGATIVE;
export const isRootPositive = (j: Justification) =>
  j.rootPolarity === JustificationRootPolarities.POSITIVE;
export const isRootNegative = (j: Justification) =>
  j.rootPolarity === JustificationRootPolarities.NEGATIVE;
export const isVerified = (j: JustificationViewModel) =>
  j.vote && j.vote.polarity === JustificationVotePolarities.POSITIVE;
export const isDisverified = (j: JustificationViewModel) =>
  j.vote && j.vote.polarity === JustificationVotePolarities.NEGATIVE;
// If a justification targets another justification, its polarity should always be negative
export const isCounter = (j: Justification) =>
  j.target.type === JustificationTargetTypes.JUSTIFICATION && isNegative(j);
export const isRootJustification = (j: Justification) =>
  j.target.type === j.rootTargetType && j.target.entity.id === j.rootTarget.id;
export const hasQuote = (j: Justification) => isWritQuoteBased(j) && j.basis.entity.quoteText;
export const isPropositionCompoundBased = (j: Justification) =>
  j ? j.basis.type === JustificationBasisTypes.PROPOSITION_COMPOUND : false;
export const isWritQuoteBased = (j: Justification) =>
  j ? j.basis.type === JustificationBasisTypes.WRIT_QUOTE : false;
export const isJustificationBasisCompoundBased = (j: Justification) =>
  j
    ? j.basis.type === JustificationBasisTypes.JUSTIFICATION_BASIS_COMPOUND
    : false;

export const negateJustificationVotePolarity = (polarity: JustificationVotePolarity) => {
  switch (polarity) {
    case JustificationVotePolarities.POSITIVE:
      return JustificationVotePolarities.NEGATIVE;
    case JustificationVotePolarities.NEGATIVE:
      return JustificationVotePolarities.POSITIVE;
    default:
      throw newExhaustedEnumError("JustificationVotePolarities", polarity);
  }
};

export const negateRootPolarity = (rootPolarity: JustificationRootPolarity) => {
  switch (rootPolarity) {
    case JustificationRootPolarities.POSITIVE:
      return JustificationRootPolarities.NEGATIVE;
    case JustificationRootPolarities.NEGATIVE:
      return JustificationRootPolarities.POSITIVE;
    default:
      throw newImpossibleError(`unsupported root polarity: ${rootPolarity}`);
  }
};

export const makeNewCredentials = (props) => assign({ email: "", password: "" }, props);

export const makeNewPasswordResetRequest = (props) =>
  assign(
    {
      email: "",
    },
    props
  );
export const makeNewPasswordResetConfirmation = (props) =>
  assign(
    {
      userId: null,
      email: null,
      passwordResetCode: null,
    },
    props
  );

export const makeNewRegistrationRequest = (props) =>
  assign(
    {
      email: "",
    },
    props
  );

export const makeNewRegistrationConfirmation = (props) =>
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

export const makeUser = (props) =>
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

export const makeAccountSettings = (props) =>
  assign(
    {
      paidContributionsDisclosure: "",
    },
    props
  );

export const makeNewProposition = (props) => assign({ text: "" }, props);

export const makeNewStatement = (speaker, sentenceType, sentence) => ({
  speaker,
  sentenceType,
  sentence,
});

export const makeNewSourceExcerptJustification = (props) => {
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

function translateNewSourceExcerptEntity(sourceExcerpt) {
  switch (sourceExcerpt.type) {
    case SourceExcerptTypes.WRIT_QUOTE:
      sourceExcerpt.writQuote = sourceExcerpt.writQuote || sourceExcerpt.entity;
      break;
    case SourceExcerptTypes.PIC_REGION:
      sourceExcerpt.picRegion = sourceExcerpt.picRegion || sourceExcerpt.entity;
      break;
    case SourceExcerptTypes.VID_SEGMENT:
      sourceExcerpt.vidSegment =
        sourceExcerpt.vidSegment || sourceExcerpt.entity;
      break;
    default:
      throw newExhaustedEnumError("SourceExcerptTypes", sourceExcerpt.type);
  }
  delete sourceExcerpt.entity;
}

export const makeNewWrit = (props) =>
  merge(
    {
      title: "",
    },
    props
  );

export const makeNewSourceExcerptParaphrase = (props) =>
  merge(
    {
      paraphrasingProposition: makeNewProposition(),
      sourceExcerpt: makeNewSourceExcerpt(),
    },
    props
  );

export const makeNewSourceExcerpt = (props) =>
  merge(
    {
      type: SourceExcerptTypes.WRIT_QUOTE,
      writQuote: makeNewWritQuote(),
    },
    props
  );

export const makeNewWritQuote = (props) =>
  merge(
    {
      writ: makeNewWrit(),
      quoteText: "",
      urls: [makeNewUrl()],
    },
    props
  );

export const makeNewPropositionCompound = (props) =>
  assign({ atoms: [makeNewPropositionAtom()] }, props);

export const makeNewJustificationBasisCompound = (props) =>
  assign({ atoms: [makeNewJustificationBasisCompoundAtom()] }, props);

export const makeNewJustificationBasisCompoundAtom = (props) => {
  const atom = {
    type: JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE,
    proposition: makeNewProposition(),
    sourceExcerptParaphrase: makeNewSourceExcerptParaphrase(),
  };

  if (
    props &&
    props.type ===
      JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE &&
    props.sourceExcerptParaphrase.sourceExcerpt
  ) {
    translateNewSourceExcerptEntity(
      props.sourceExcerptParaphrase.sourceExcerpt
    );
  }

  return merge(atom, props);
};

export const makeNewPropositionAtom = (props) =>
  assign({ entity: makeNewProposition() }, props);

export const makeNewJustificationBasisCompoundFromSourceExcerptParaphrase = (
  sourceExcerptParaphrase
) =>
  makeNewJustificationBasisCompound({
    atoms: [
      makeNewJustificationBasisCompoundAtom({
        type: JustificationBasisCompoundAtomTypes.SOURCE_EXCERPT_PARAPHRASE,
        sourceExcerptParaphrase,
      }),
    ],
  });

export const makeNewJustificationBasisCompoundFromProposition = (proposition) =>
  makeNewJustificationBasisCompound({
    atoms: [
      makeNewJustificationBasisCompoundAtom({
        type: JustificationBasisCompoundAtomTypes.PROPOSITION,
        proposition,
      }),
    ],
  });

export const makeNewJustificationBasisCompoundFromWritQuote = (writQuote) =>
  makeNewJustificationBasisCompound({
    atoms: [
      makeNewJustificationBasisCompoundAtom({
        sourceExcerptParaphrase: makeNewSourceExcerptParaphrase({
          sourceExcerpt: { writQuote },
        }),
      }),
    ],
  });

export const makeNewJustificationBasisCompoundFromPropositionCompound = (
  propositionCompound
) =>
  makeNewJustificationBasisCompound({
    atoms: map(propositionCompound.atoms, (propositionAtom) =>
      makeNewJustificationBasisCompoundAtom({
        type: JustificationBasisCompoundAtomTypes.PROPOSITION,
        proposition: propositionAtom.entity,
      })
    ),
  });

export const makeNewPropositionCompoundFromProposition = (proposition) =>
  makeNewPropositionCompound({
    atoms: [makeNewPropositionAtom({ entity: proposition })],
  });

/** Trunk justifications directly target the root */
export const makeNewTrunkJustification = (targetType, targetId, polarity = null) =>
  makeNewJustification({
    rootTargetType: targetType,
    rootTarget: { id: targetId },
    polarity,
    target: { type: targetType, entity: { id: targetId } },
  });

export const makeNewPropositionJustification = (
  propositionProps,
  justificationProps
) => ({
  proposition: makeNewProposition(propositionProps),
  speakers: [],
  newJustification: makeNewJustification(justificationProps),
  // whether to have the justification controls expanded and to create a justification along with the proposition
  doCreateJustification: !!justificationProps,
});

export const makeNewCounterJustification = (targetJustification) => ({
  rootTargetType: targetJustification.rootTargetType,
  rootTarget: { id: targetJustification.rootTarget.id },
  target: {
    type: JustificationTargetTypes.JUSTIFICATION,
    entity: targetJustification,
  },
  basis: {
    type: JustificationBasisTypes.PROPOSITION_COMPOUND,
    propositionCompound: makeNewPropositionCompound(),
  },
  polarity: JustificationPolarities.NEGATIVE,
});

export const makeNewPropositionCompoundAtomFromProposition = (proposition) => ({
  entity: proposition,
});

export const makeNewUrl = () => ({ url: "" });

export const makeNewPersorg = () => ({
  isOrganization: false,
  name: "",
  knownFor: "",
  websiteUrl: null,
  twitterUrl: null,
  wikipediaUrl: null,
});

export const makeNewContentReport = (fields) =>
  merge(
    {
      entityType: null,
      entityId: null,
      // type (string) to boolean of whether the type is selected
      checkedByType: {},
      // Holds only the selected types; populated before posting to API
      types: [],
      description: "",
      url: null,
    },
    fields
  );

/**
 * Compare two entity IDs for equality
 *
 * If the ID came from the database, it may be an integer.  So convert both to string before doing strict equality.
 * The orm mappers and dao methods (in the case of a dao method returning a bare ID) are responsible for converting IDs
 * to strings.  But because this comparison is so important, it is worthwile having a special method to ensure that
 * there is no mistake.  One thing we don't do is convert an integer identifier from the client into a string, e.g..
 */
export const idEqual = (id1, id2) =>
  isDefined(id1) && isDefined(id2) && asString(id1) === asString(id2);

export const makeTag = (props) =>
  merge(
    {
      name: "",
    },
    props
  );

export const tagEqual = (tag1, tag2) =>
  idEqual(tag1.id, tag2.id) ||
  (isDefined(tag1.name) && tag1.name === tag2.name);

export const makePropositionTagVote = (props) => merge({}, props);

export const doTargetSameRoot = (j1, j2) =>
  idEqual(j1.rootTarget.id, j2.rootTarget.id) &&
  j1.rootTargetType === j2.rootTargetType;

export const makeNewAccountSettings = () => ({});
