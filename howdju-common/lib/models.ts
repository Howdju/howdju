import { cloneDeep, assign, merge, toString as asString } from "lodash";
import { PartialDeep } from "type-fest";
import { v4 as uuidv4 } from "uuid";

import { JustificationOut } from "./apiModels";
import {
  newImpossibleError,
  newExhaustedEnumError,
  newProgrammingError,
  newUnimplementedError,
} from "./commonErrors";
import { EntityId } from "./entities";
import { isDefined } from "./general";
import { OneOf } from "./typeUtils";
import { JustificationView } from "./viewModels";
import { ModelErrors } from "./zodError";
import {
  AccountSettings,
  CreateCounterJustification,
  CreateCounterJustificationBasis,
  CreateCounterJustificationInput,
  CreateCounterJustificationInputBasis,
  CreateCounterJustificationInputTarget,
  CreateCounterJustificationTarget,
  CreateJustification,
  CreateJustificationBasis,
  CreateJustificationInput,
  CreateJustificationInputBasis,
  CreateJustificationInputBasisSourceExcerpt,
  CreateJustificationInputRootTarget,
  CreateJustificationInputTarget,
  CreateJustificationTarget,
  CreateJustifiedSentenceInput,
  CreateMediaExcerptCitationInput,
  CreateMediaExcerptInput,
  CreateMediaExcerptSpeakerInput,
  CreatePersorg,
  CreatePicRegionInput,
  CreatePropositionCompoundAtomInput,
  CreatePropositionCompoundInput,
  CreatePropositionInput,
  CreateRegistrationConfirmationInput,
  CreateRegistrationRequest,
  CreateRegistrationRequestInput,
  CreateSourceExcerpt,
  CreateSourceExcerptInput,
  CreateStatementInput,
  CreateTagInput,
  CreateUrl,
  CreateUrlInput,
  CreateUrlLocatorInput,
  CreateVidSegmentInput,
  CreateWritInput,
  CreateWritQuoteInput,
  Credentials,
  Entity,
  Justification,
  JustificationPolarity,
  JustificationRef,
  JustificationRootPolarity,
  JustificationRootTarget,
  JustificationRootTargetType,
  JustificationVotePolarity,
  PicRegion,
  PropositionTagVote,
  SourceExcerpt,
  Tag,
  Url,
  VidSegment,
} from "./zodSchemas";
import { EntityOrRef, isRef, ToInput } from "./zodSchemaTypes";

export const isPositive = (j: Justification | JustificationOut) =>
  j.polarity === "POSITIVE";
export const isNegative = (j: Justification | JustificationOut) =>
  j.polarity === "NEGATIVE";
export const isRootPositive = (j: Justification | JustificationOut) =>
  j.rootPolarity === "POSITIVE";
export const isRootNegative = (j: Justification | JustificationOut) =>
  j.rootPolarity === "NEGATIVE";

export const isRootJustification = (j: Justification) =>
  j.target?.type === j.rootTargetType &&
  j.target?.entity.id === j.rootTarget.id;
export const hasQuote = (j: Justification) =>
  j.basis.type === "WRIT_QUOTE" && j.basis.entity.quoteText;
export const isPropositionCompoundBased = (
  j: Justification | CreateJustification | CreateJustificationInput
) => (j ? j.basis.type === "PROPOSITION_COMPOUND" : false);

export function isMediaExcerptBased(
  j: Justification | CreateJustification | CreateJustificationInput
) {
  return j.basis.type === "MEDIA_EXCERPT";
}

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

export const makeCredentials = (props?: Partial<Credentials>): Credentials =>
  assign({ email: "", password: "" }, props);

export const makeCreateRegistrationRequestInput = (
  props?: Partial<CreateRegistrationRequestInput>
): CreateRegistrationRequestInput => {
  return assign({ email: "" }, props);
};

export const makeCreateRegistrationRequest = (
  props?: Partial<CreateRegistrationRequest>
): CreateRegistrationRequest =>
  assign(
    {
      email: "",
    },
    props
  );

export const makeCreateRegistrationConfirmationInput = (
  props?: Partial<CreateRegistrationConfirmationInput>
): CreateRegistrationConfirmationInput =>
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

export const makeCreateRegistrationConfirmation =
  makeCreateRegistrationConfirmationInput;

export const makeAccountSettings = (
  props?: Partial<AccountSettings>
): AccountSettings =>
  assign(
    {
      paidContributionsDisclosure: "",
    },
    props
  );

export const makeCreatePropositionCompoundInput =
  (): CreatePropositionCompoundInput => ({
    atoms: [makeCreatePropositionCompoundAtomInput()],
  });

export const makeCreatePropositionCompoundInputFromProposition = (
  proposition: CreatePropositionInput
): CreatePropositionCompoundInput => ({
  atoms: [{ entity: proposition, key: uuidv4() }],
});

export const makeCreatePropositionCompoundAtomInput =
  (): CreatePropositionCompoundAtomInput => ({
    entity: makeCreatePropositionInput(),
    key: uuidv4(),
  });

export const makeUrl = (props?: Partial<Url>): Url => merge({ url: "" }, props);

export const makeCreateUrl = (props?: Partial<CreateUrl>): CreateUrl =>
  merge({ url: "" }, props);

export const makeCreateUrlLocatorInput = (
  props?: Partial<CreateUrlLocatorInput>
): CreateUrlLocatorInput => merge({ url: makeCreateUrl() }, props);

export function makeCreateMediaExcerptCitationInput(
  props?: Partial<CreateMediaExcerptCitationInput>
): CreateMediaExcerptCitationInput {
  return merge({ source: { description: "" } }, props);
}

export const makeCreateMediaExcerptSpeakerInput = (
  props?: Partial<CreateMediaExcerptSpeakerInput>
): CreateMediaExcerptSpeakerInput =>
  merge(
    {
      persorg: makeCreatePersorg(),
    },
    props
  );

export const makeCreatePersorg = (): CreatePersorg => ({
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

export const makeCreateTagInput = (props: Partial<Tag>): CreateTagInput =>
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

export const makePropositionTagVote = (
  props: PropositionTagVote
): PropositionTagVote => props;

// TODO(107): replace with Justification.rootTarget?
type RootTargetInfo = Pick<Justification, "rootTargetType"> & {
  rootTarget: Pick<JustificationRootTarget, "id">;
};
export const doTargetSameRoot = (j1: RootTargetInfo, j2: RootTargetInfo) =>
  idEqual(j1.rootTarget.id, j2.rootTarget.id) &&
  j1.rootTargetType === j2.rootTargetType;

export const makeNewAccountSettings = () => ({});

export function makeVidSegment(): VidSegment {
  return {};
}

export function makePicRegion(): PicRegion {
  return {};
}

export const makeCreateJustifiedSentenceInput = (
  propositionProps: PartialDeep<CreatePropositionInput> = {},
  justificationProps: PartialDeep<CreateJustificationInput> = {}
): CreateJustifiedSentenceInput => ({
  proposition: makeCreatePropositionInput(propositionProps),
  speakers: [],
  justification: makeCreateJustificationInput(justificationProps),
  // whether to have the justification controls expanded and to create a justification along with the proposition
  doCreateJustification: !!justificationProps,
});

export const makeCreateStatementInput = (
  props?: Partial<CreateStatementInput>
): CreateStatementInput =>
  merge(
    {
      speaker: makeCreatePersorg(),
      sentenceType: "PROPOSITION",
      sentence: makeCreatePropositionInput(),
    },
    props
  );
export const makeCreatePropositionInput = (
  props?: Partial<CreatePropositionInput>
): CreatePropositionInput => assign({ text: "" }, props);

export const makeCreateJustificationInput = (
  props?: PartialDeep<CreateJustificationInput>
): CreateJustificationInput => {
  const model = merge(
    {
      rootTargetType: "PROPOSITION",
      rootTarget: { text: "" },
      polarity: "POSITIVE",
      rootPolarity: "POSITIVE",
      target: {
        type: "PROPOSITION",
        proposition: makeCreatePropositionInput(),
        statement: makeCreateStatementInput(),
        // Must be undefined to prevent infinite recursion
        justification: undefined,
      },
      basis: {
        type: "PROPOSITION_COMPOUND",
        propositionCompound: makeCreatePropositionCompoundInput(),
        mediaExcerpt: makeCreateMediaExcerptInput(),
        sourceExcerpt: makeCreateSourceExcerptInput(),
        writQuote: makeCreateWritQuoteInput(),
      },
    } as CreateJustificationInput,
    props
  );

  inferCreateJustificationInputRootTarget(model);

  return model;
};

export function makeCreateMediaExcerptInput(
  props?: Partial<CreateMediaExcerptInput>
): CreateMediaExcerptInput {
  return merge(
    {
      localRep: {
        quotation: "",
      },
      locators: {
        urlLocators: [],
      },
      citations: [{ source: { description: "" } }],
      speakers: [],
    },
    props
  );
}

export const makeWritInput = (): CreateWritInput => ({ title: "" });
export const makeUrlInput = (): CreateUrlInput => ({ url: "" });

export const makeCreateWritQuoteInput = (
  props?: Partial<CreateWritQuoteInput>
): CreateWritQuoteInput =>
  merge(
    {
      writ: makeWritInput(),
      quoteText: "",
      urls: [makeUrlInput()],
    },
    props
  );
export const makeCreatePicRegionInput: (
  props?: Partial<CreatePicRegionInput>
) => CreatePicRegionInput = makePicRegion;
export const makeCreateVidSegmentInput: (
  props?: Partial<CreateVidSegmentInput>
) => CreateVidSegmentInput = makeVidSegment;

function inferCreateJustificationInputRootTarget(
  model: CreateJustificationInput
) {
  let targetEntity = demuxCreateJustificationInputTarget(model.target).entity;
  let targetType = model.target.type;
  let rootPolarity: JustificationPolarity = model.polarity;
  while (targetEntity && "target" in targetEntity) {
    rootPolarity = targetEntity.polarity;
    targetType = targetEntity.target.type;
    targetEntity = targetEntity.target.entity;
  }
  if (targetType === "JUSTIFICATION" || !targetEntity) {
    throw newProgrammingError(
      "Unable to infer justification root target. We ended up at a justification."
    );
  }
  model.rootTargetType = targetType;
  // targetEntity cannot be a justification reference because we threw right above if it was.
  model.rootTarget = targetEntity as CreateJustificationInputRootTarget;
  model.rootPolarity = rootPolarity;
}

export function makeCreateSourceExcerptInput(
  props?: Partial<CreateSourceExcerptInput>
): CreateSourceExcerptInput {
  return merge(
    {
      type: "WRIT_QUOTE",
      writQuote: makeCreateWritQuoteInput(),
      picRegion: makeCreatePicRegionInput(),
      vidSegment: makeCreateVidSegmentInput(),
    },
    props
  );
}

// Try to support JBCs as little as possible since they are deprecated. Viz., don't implement
// creating them.
export function makeCreateJustificationBasisCompoundInput(): Entity {
  return {};
}

const demuxCreateJustificationInputTarget = (
  target: CreateJustificationInputTarget | CreateCounterJustificationInputTarget
): CreateJustificationTarget => {
  switch (target.type) {
    case "PROPOSITION":
      return {
        type: "PROPOSITION",
        entity: target.proposition,
      };
    case "STATEMENT":
      // TODO(201) WritQuote bases are temporarily supported until we support SourceExcerpt bases.
      return {
        type: "STATEMENT",
        entity: target.statement,
      };
    case "JUSTIFICATION":
      if (!target.justification) {
        throw newProgrammingError(
          "CreateJustificationInput.target must hold another CreateJustificationInput when type is JUSTIFICATION."
        );
      }
      return {
        type: "JUSTIFICATION",
        entity: isRef(target.justification)
          ? target.justification
          : demuxCreateJustificationInput(target.justification),
      };
    default:
      throw newExhaustedEnumError(target);
  }
};

export function demuxCreateJustificationInput(
  input: CreateJustificationInput
): CreateJustification;
export function demuxCreateJustificationInput(
  input: CreateCounterJustificationInput
): CreateCounterJustification;
export function demuxCreateJustificationInput(
  input: CreateJustificationInput | CreateCounterJustificationInput
): CreateJustification | CreateCounterJustification {
  const basis = demuxCreateJustificationInputBasis(input.basis);
  const target = demuxCreateJustificationInputTarget(input.target);
  const creation: CreateJustification = assign(cloneDeep(input), {
    target,
    basis,
  });
  return creation;
}

export const muxCreateJustificationErrors = <
  C extends CreateJustification | CreateCounterJustification
>(
  create: C,
  createErrors: ModelErrors<C>
): ModelErrors<ToInput<C>> => {
  const basis =
    createErrors.basis &&
    muxCreateJustificationBasisErrors(create.basis, createErrors.basis);
  const target =
    createErrors.target &&
    muxCreateJustificationTargetErrors(create.target, createErrors.target);
  const inputErrors = assign(cloneDeep(createErrors), {
    target,
    basis,
  }) as ModelErrors<ToInput<C>>;
  return inputErrors;
};

function muxCreateJustificationTargetErrors(
  target: CreateJustificationTarget | CreateCounterJustificationTarget,
  errors: ModelErrors<
    CreateJustificationTarget | CreateCounterJustificationTarget
  >
): ModelErrors<
  CreateJustificationInputTarget | CreateCounterJustificationInputTarget
> {
  switch (target.type) {
    case "PROPOSITION":
      return {
        _errors: errors._errors,
        proposition: errors.entity,
      };
    case "STATEMENT":
      return {
        _errors: errors._errors,
        statement: errors.entity,
      };
    case "JUSTIFICATION":
      return {
        _errors: errors._errors,
        justification:
          "basis" in target.entity
            ? errors.entity &&
              muxCreateJustificationErrors(target.entity, errors.entity)
            : errors.entity,
      };
    default:
      throw newExhaustedEnumError(target);
  }
}

const muxCreateJustificationBasisErrors = (
  basis: CreateJustificationBasis | CreateCounterJustificationBasis,
  errors: ModelErrors<
    CreateJustificationBasis | CreateCounterJustificationBasis
  >
): ModelErrors<
  CreateJustificationInputBasis | CreateCounterJustificationInputBasis
> => {
  switch (basis.type) {
    case "PROPOSITION_COMPOUND":
      return {
        _errors: errors._errors,
        propositionCompound: errors.entity,
      };
    case "MEDIA_EXCERPT":
      return {
        _errors: errors._errors,
        mediaExcerpt: errors.entity,
      };
    case "WRIT_QUOTE":
      return {
        _errors: errors._errors,
        writQuote: errors.entity,
      };
    case "SOURCE_EXCERPT":
      return {
        _errors: errors._errors,
        sourceExcerpt: isRef(basis.entity)
          ? errors.entity
          : errors.entity &&
            muxCreateSourceExcerptErrors(basis.entity, errors.entity),
      };
    default:
      throw newExhaustedEnumError(basis);
  }
};

function muxCreateSourceExcerptErrors(
  create: CreateSourceExcerpt,
  createErrors: ModelErrors<CreateSourceExcerpt>
) {
  switch (create.type) {
    case "WRIT_QUOTE":
      return {
        _errors: createErrors._errors,
        writQuote: createErrors.entity,
      };
    case "PIC_REGION":
      return {
        _errors: createErrors._errors,
        picRegion: createErrors.entity,
      };
    case "VID_SEGMENT":
      return {
        _errors: createErrors._errors,
        vidSegment: createErrors.entity,
      };
  }
}

const demuxCreateJustificationInputBasis = (
  basis: CreateJustificationInputBasis | CreateCounterJustificationInputBasis
): CreateJustificationBasis => {
  switch (basis.type) {
    case "PROPOSITION_COMPOUND":
      return {
        type: "PROPOSITION_COMPOUND",
        entity: basis.propositionCompound,
      };
    case "MEDIA_EXCERPT":
      if (!basis.mediaExcerpt) {
        throw newImpossibleError("Media excerpt must be defined.");
      }
      return {
        type: "MEDIA_EXCERPT",
        entity: basis.mediaExcerpt,
      };
    case "WRIT_QUOTE":
      // TODO(#201) remove WritQuote support
      return {
        type: "WRIT_QUOTE",
        entity: basis.writQuote,
      };
    case "JUSTIFICATION_BASIS_COMPOUND":
      // TODO(#201) remove JUSTIFICATION_BASIS_COMPOUND
      throw newUnimplementedError(
        "JUSTIFICATION_BASIS_COMPOUND is not supported."
      );
    case "SOURCE_EXCERPT":
      return {
        type: "SOURCE_EXCERPT",
        entity: demuxJustificationBasisSourceExcerptInput(basis.sourceExcerpt),
      };
    default:
      throw newExhaustedEnumError(basis);
  }
};

export function demuxJustificationBasisSourceExcerptInput(
  sourceExcerpt: CreateJustificationInputBasisSourceExcerpt
): EntityOrRef<CreateSourceExcerpt> {
  if (isRef(sourceExcerpt)) {
    // It must be a Ref.
    return sourceExcerpt;
  }
  switch (sourceExcerpt.type) {
    case "PIC_REGION":
      return {
        type: "PIC_REGION",
        entity: sourceExcerpt.picRegion,
      };
    case "VID_SEGMENT":
      return {
        type: "VID_SEGMENT",
        entity: sourceExcerpt.vidSegment,
      };
    case "WRIT_QUOTE":
      return {
        type: "WRIT_QUOTE",
        entity: sourceExcerpt.writQuote,
      };
  }
}

export function muxSourceExcerpt(
  sourceExcerpt: SourceExcerpt
): CreateSourceExcerptInput {
  const input = makeCreateSourceExcerptInput(sourceExcerpt);
  const muxEntity = muxSourceExcerptEntity(sourceExcerpt);
  return { ...input, ...muxEntity };
}

function muxSourceExcerptEntity(
  sourceExcerpt: SourceExcerpt
): OneOf<Omit<CreateSourceExcerptInput, "type">> {
  switch (sourceExcerpt.type) {
    case "WRIT_QUOTE":
      return { writQuote: sourceExcerpt.entity };
    case "PIC_REGION":
      return { picRegion: sourceExcerpt.entity };
      break;
    case "VID_SEGMENT":
      return { vidSegment: sourceExcerpt.entity };
  }
}

/** Returns a CreateCounterJustificationInput targeting targetJustification.
 *
 * If targetJustification is another input, it targets it directly. If targetJustification is
 * persisted, then it counters a ref to it.
 */
export const makeCreateCounterJustificationInput = (
  targetJustification:
    | CreateJustificationInput
    | JustificationOut
    | JustificationView
): CreateCounterJustificationInput => ({
  rootPolarity: negateRootPolarity(targetJustification.rootPolarity),
  target: {
    type: "JUSTIFICATION",
    justification: targetJustification.id
      ? JustificationRef.parse(targetJustification)
      : (targetJustification as CreateJustificationInput),
  },
  basis: {
    type: "PROPOSITION_COMPOUND",
    propositionCompound: makeCreatePropositionCompoundInput(),
  },
  polarity: "NEGATIVE",
});

/** Trunk justifications directly target the root */
export const makeCreateJustificationInputTargetingRoot = (
  targetType: JustificationRootTargetType,
  targetId: EntityId,
  polarity?: JustificationPolarity
): CreateJustificationInput => {
  let targetEntityProperty;
  switch (targetType) {
    case "PROPOSITION":
      targetEntityProperty = "proposition";
      break;
    case "STATEMENT":
      targetEntityProperty = "statement";
      break;
    default:
      throw newExhaustedEnumError(targetType);
  }
  return makeCreateJustificationInput({
    rootTargetType: targetType,
    rootTarget: { id: targetId },
    polarity,
    target: { type: targetType, [targetEntityProperty]: { id: targetId } },
  });
};
