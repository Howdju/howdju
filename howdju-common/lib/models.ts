import { cloneDeep } from "lodash";
import assign from "lodash/assign";
import merge from "lodash/merge";
import asString from "lodash/toString";
import { PartialDeep } from "type-fest";

import {
  newImpossibleError,
  newExhaustedEnumError,
  newProgrammingError,
  newUnimplementedError,
} from "./commonErrors";
import { EntityId } from "./entities";
import { isDefined } from "./general";
import { OneOf } from "./typeUtils";
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
  CreatePicRegionInput,
  CreatePropositionCompoundAtomInput,
  CreatePropositionCompoundInput,
  CreatePropositionInput,
  CreateRegistrationConfirmationInput,
  CreateRegistrationRequestInput,
  CreateSourceExcerpt,
  CreateSourceExcerptInput,
  CreateStatementInput,
  CreateVidSegmentInput,
  CreateWritQuoteInput,
  EditPicRegionInput,
  EditProposition,
  EditVidSegmentInput,
  EditWritQuoteInput,
  Entity,
  Justification,
  JustificationPolarity,
  JustificationRef,
  JustificationRootPolarity,
  JustificationRootTargetType,
  JustificationVotePolarity,
  Persorg,
  PicRegion,
  Proposition,
  PropositionCompound,
  PropositionCompoundAtom,
  PropositionTagVote,
  RegistrationRequest,
  SourceExcerpt,
  SourceExcerptRef,
  Statement,
  Tag,
  TagVote,
  Url,
  VidSegment,
  Writ,
  WritQuote,
} from "./zodSchemas";
import { EntityOrRef, isRef, Persisted, ToInput } from "./zodSchemaTypes";

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

export const makeCreateRegistrationRequestInput = (
  props?: Partial<CreateRegistrationRequestInput>
): CreateRegistrationRequestInput => {
  return assign({ email: "" }, props);
};

export const makeRegistrationRequest = (
  props?: Partial<RegistrationRequest> & Pick<RegistrationRequest, "expires">
): RegistrationRequest =>
  assign(
    {
      email: "",
      isConsumed: false,
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

export const makePropositionTagVote = (
  props: PropositionTagVote
): PropositionTagVote => props;

export const makeCreatePropositionTagVote = makePropositionTagVote;

export const makeTagVote = (props: TagVote): TagVote => props;
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

export const makeCreateJustifiedSentenceInput = (
  propositionProps: Partial<CreatePropositionInput>,
  justificationProps: Partial<CreateJustificationInput>
): CreateJustifiedSentenceInput => ({
  proposition: makeCreatePropositionInput(propositionProps),
  speakers: [],
  justification: makeCreateJustificationInput(justificationProps),
  // whether to have the justification controls expanded and to create a justification along with the proposition
  doCreateJustification: !!justificationProps,
});

export const makeCreateStatementInput: (
  props?: Partial<CreateStatementInput>
) => CreateStatementInput = makeStatement;
export const makeCreatePropositionInput: (
  props?: Partial<CreatePropositionInput>
) => CreatePropositionInput = makeProposition;
export const makeCreatePropositionCompoundInput: (
  props?: Partial<CreatePropositionCompoundInput>
) => CreatePropositionCompoundInput = makePropositionCompound;

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
        sourceExcerpt: makeCreateSourceExcerptInput(),
        writQuote: makeCreateWritQuoteInput(),
      },
    } as CreateJustificationInput,
    props
  );

  inferCreateJustificationInputRootTarget(model);

  return model;
};

export const makeCreateWritQuoteInput: (
  props?: Partial<CreateWritQuoteInput>
) => CreateWritQuoteInput = makeWritQuote;
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

export function makeEditVidSegmentInput(): EditVidSegmentInput {
  return makeVidSegment();
}

export function makeEditWritQuoteInput(): EditWritQuoteInput {
  return makeWritQuote();
}

export function makeEditPicRegionInput(): EditPicRegionInput {
  return makePicRegion();
}

export function makePropositionEditModel(): EditProposition {
  return makeProposition();
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
      // TODO WritQuote bases are temporarily supported until we support SourceExcerpt bases.
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
): CreateJustification | CreateCounterJustificationInput {
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
  // TODO(1): After we type the CreatePropositionPage, we should be able to figure out why this is
  // non-null despite the type system
  if (!createErrors) {
    return {} as ModelErrors<ToInput<C>>;
  }
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
        justification: isRef(target.entity)
          ? errors.entity
          : errors.entity &&
            muxCreateJustificationErrors(target.entity, errors.entity),
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
    case "WRIT_QUOTE":
      // TODO WritQuote bases are temporarily supported until we support SourceExcerpt bases.
      return {
        type: "WRIT_QUOTE",
        entity: basis.writQuote,
      };
    case "SOURCE_EXCERPT":
      return {
        type: "SOURCE_EXCERPT",
        entity: demuxJustificationBasisSourceExcerptInput(basis.sourceExcerpt),
      };
    case "JUSTIFICATION_BASIS_COMPOUND":
      throw newUnimplementedError(`Unsupported basis type: ${basis.type}`);
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
    default:
      throw newExhaustedEnumError(sourceExcerpt.type);
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
    | (Persisted<Justification> & Pick<Justification, "rootPolarity">)
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

export function copyJustificationForInput(
  justification: Justification
): CreateJustificationInput {
  let justificationTarget;
  let propositionTarget;
  let statementTarget;
  switch (justification.target.type) {
    case "JUSTIFICATION":
      justificationTarget = copyJustificationForInput(
        justification.target.entity
      );
      break;
    case "PROPOSITION":
      propositionTarget = justification.target.entity;
      break;
    case "STATEMENT":
      statementTarget = justification.target.entity;
      break;
    default:
      throw newExhaustedEnumError(justification.target);
  }

  let sourceExcerptBasis;
  let propositionCompoundBasis;
  switch (justification.basis.type) {
    case "SOURCE_EXCERPT":
      sourceExcerptBasis = copySourceExcerptForInput(
        justification.basis.entity
      );
      break;
    case "PROPOSITION_COMPOUND":
      propositionCompoundBasis = justification.basis.entity;
      break;
    default:
      throw newUnimplementedError(
        `Unsupported justification basis type: ${justification.basis.type}`
      );
  }

  // Remove entity
  const { entity: targetEntity, ...target } = justification.target;
  const { entity: basisEntity, ...basis } = justification.basis;
  return {
    ...justification,
    target: {
      ...target,
      justification: justificationTarget ?? makeCreateJustificationInput(),
      statement: statementTarget ?? makeCreateStatementInput(),
      proposition: propositionTarget ?? makeCreatePropositionInput(),
    },
    basis: {
      ...basis,
      sourceExcerpt: sourceExcerptBasis ?? makeCreateSourceExcerptInput(),
      propositionCompound:
        propositionCompoundBasis ?? makeCreatePropositionCompoundInput(),
      writQuote: makeCreateWritQuoteInput(),
      justificationBasisCompound: makeCreateJustificationBasisCompoundInput(),
    },
  };
}

export function copySourceExcerptForInput(
  sourceExcerpt: EntityOrRef<SourceExcerpt>
): CreateSourceExcerptInput | SourceExcerptRef {
  if (isRef(sourceExcerpt)) {
    return SourceExcerptRef.parse(sourceExcerpt);
  }
  let writQuote;
  let picRegion;
  let vidSegment;
  switch (sourceExcerpt.type) {
    case "WRIT_QUOTE":
      writQuote = sourceExcerpt.entity;
      break;
    case "PIC_REGION":
      picRegion = sourceExcerpt.entity;
      break;
    case "VID_SEGMENT":
      vidSegment = sourceExcerpt.entity;
      break;
    default:
      throw newImpossibleError(sourceExcerpt);
  }
  const { entity, ...props } = sourceExcerpt;
  return {
    ...props,
    writQuote: writQuote ?? makeCreateWritQuoteInput(),
    picRegion: picRegion ?? makeCreatePicRegionInput(),
    vidSegment: vidSegment ?? makeCreateVidSegmentInput(),
  };
}

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
