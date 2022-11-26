/** Types and functions relating to clients, including view models. */
import merge from "lodash/merge";
import type { PartialDeep } from "type-fest";

import {
  ContentReport,
  CreateCounterJustificationInput,
  Entity,
  EntityId,
  EntityOrRef,
  FactoryInput,
  Justification,
  CreateJustificationInput,
  CreateJustificationRootTargetInput,
  CreateJustificationTargetInput,
  JustificationPolarity,
  JustificationRootTarget,
  JustificationRootTargetType,
  makePicRegion,
  makeProposition,
  makePropositionCompound,
  makeSourceExcerpt,
  makeStatement,
  makeVidSegment,
  makeWritQuote,
  negateRootPolarity,
  newExhaustedEnumError,
  newProgrammingError,
  Persisted,
  Proposition,
  CreatePropositionInput,
  EditProposition,
  PropositionTagVote,
  Ref,
  SourceExcerpt,
  CreateSourceExcerptInput,
  SourceExcerptParaphrase,
  Tag,
  isRef,
  JustificationRef,
  newUnimplementedError,
  newImpossibleError,
  EntityName,
  JustificationVote,
  EditVidSegmentInput,
  EditWritQuoteInput,
  EditPicRegionInput,
  CreateStatementInput,
  CreatePropositionCompoundInput,
  OneOf,
  CreatePersorgInput,
  SourceExcerptRef,
  CreateWritQuoteInput,
  CreatePicRegionInput,
  CreateVidSegmentInput,
  CreateContentReportInput,
  TagVote,
} from "howdju-common";

export type JustificationViewModel = Persisted<Justification> & {
  /** The current user's vote on this justification. */
  vote?: JustificationVote;
  // The sorting score for the current user
  score?: number;
  // Justifications countering this justification.
  counterJustifications: JustificationViewModel[];
};

// TODO rename to JustificationRootTargetRef, replace justifications with hasAgreement and hasDisagreement.
export type JustificationRootTargetViewModel = Ref<
  EntityName<JustificationRootTarget>
> &
  TaggedEntityViewModel & {
    justifications: JustificationViewModel[];
    // TODO make tags a view model and put the votes on them.
    // TODO (At the very least deduplicate between TaggedEntityViewModel.tagVotes)
    propositionTagVotes: PropositionTagVoteViewModel[];
  };

export interface TaggedEntityViewModel extends Entity {
  tags: Tag[];
  // TODO put votes on tags and type it as a viewmodel
  tagVotes: TagVoteViewModel[];
  recommendedTags: Tag[];
}

export const makeCreateStatementInput: (
  props?: Partial<CreateStatementInput>
) => CreateStatementInput = makeStatement;
export const makeCreatePropositionInput: (
  props?: Partial<CreatePropositionInput>
) => CreatePropositionInput = makeProposition;
export const makeCreatePropositionCompoundInput: (
  props?: Partial<CreatePropositionCompoundInput>
) => CreatePropositionCompoundInput = makePropositionCompound;

// Try to support JBCs as little as possible since they are deprecated. Viz., don't implement
// creating them.
export function makeCreateJustificationBasisCompoundInput(): Entity {
  return {};
}

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

function demuxCreateJustificationTargetInput(
  target: CreateJustificationTargetInput
) {
  switch (target.type) {
    case "PROPOSITION":
      return target.proposition;
    case "STATEMENT":
      return target.statement;
    case "JUSTIFICATION":
      return target.justification;
  }
}

function inferCreateJustificationInputRootTarget(
  model: CreateJustificationInput
) {
  let targetEntity = demuxCreateJustificationTargetInput(model.target);
  let targetType = model.target.type;
  let rootPolarity: JustificationPolarity = model.polarity;
  while (targetEntity && "target" in targetEntity) {
    const targetJustification = targetEntity as CreateJustificationInput;
    rootPolarity = targetJustification.polarity;
    targetType = targetJustification.target.type;
    targetEntity = demuxCreateJustificationTargetInput(
      targetJustification.target
    );
  }
  if (targetType === "JUSTIFICATION" || !targetEntity) {
    throw newProgrammingError(
      "Unable to infer justification root target from."
    );
  }
  model.rootTargetType = targetType;
  // targetEntity cannot be a justification reference because we threw right above if it was.
  model.rootTarget = targetEntity as CreateJustificationRootTargetInput;
  model.rootPolarity = rootPolarity;
}

function inferJustificationRootTarget(justification: JustificationViewModel) {
  let targetEntity = justification.target.entity;
  let targetType = justification.target.type;
  let rootPolarity: JustificationPolarity = justification.polarity;
  while ("target" in targetEntity) {
    const targetJustification = targetEntity as Justification;
    rootPolarity = targetJustification.polarity;
    targetType = targetJustification.target.type;
    targetEntity = targetJustification.target.entity;
  }
  if (targetType === "JUSTIFICATION") {
    throw newProgrammingError(
      "Unable to infer justification root target from."
    );
  }
  justification.rootTargetType = targetType;
  justification.rootTarget = targetEntity as JustificationRootTarget;
  justification.rootPolarity = rootPolarity;
}

export const makeJustificationViewModel = (
  props?: FactoryInput<
    JustificationViewModel,
    "id" | "rootTarget" | "rootTargetType",
    "target" | "basis"
  >
): JustificationViewModel => {
  const init = {
    rootPolarity: "POSITIVE",
    polarity: "POSITIVE",
    counterJustifications: [],
  };
  // TODO(151) remove typecast
  const merged: JustificationViewModel = merge(
    init,
    props
  ) as unknown as JustificationViewModel;
  inferJustificationRootTarget(merged);
  return merged;
};

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

export const isVerified = (j: JustificationViewModel) =>
  j.vote && j.vote.polarity === "POSITIVE";
export const isDisverified = (j: JustificationViewModel) =>
  j.vote && j.vote.polarity === "NEGATIVE";

// TODO(1): must we export this? Where will we use it?
export function convertSourceExcerptToCreateInput(
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

/** @deprecated */
export const makeSourceExcerptParaphrase = (
  props?: Partial<SourceExcerptParaphrase>
): SourceExcerptParaphrase =>
  merge(
    {
      paraphrasingProposition: makeProposition(),
      sourceExcerpt: makeSourceExcerpt(),
    },
    props
  );

/** A view model for the JustificationsPage and also an API type, I think. */
export interface JustifiedPropositionViewModel extends Proposition {
  proposition: Proposition;
  justifications?: JustificationViewModel[];
}

/**
 * A CreationModel for creating a Proposition potentially with Speakers and/or Justifications.
 */
export interface CreateJustifiedPropositionInput {
  proposition: CreatePropositionInput;
  speakers: CreatePersorgInput[];
  doCreateJustification: boolean;
  justification: CreateJustificationInput;
}

export const makeCreateJustifiedPropositionInput = (
  propositionProps: Partial<CreatePropositionInput>,
  justificationProps: Partial<CreateJustificationInput>
): CreateJustifiedPropositionInput => ({
  proposition: makeCreatePropositionInput(propositionProps),
  speakers: [],
  justification: makeCreateJustificationInput(justificationProps),
  // whether to have the justification controls expanded and to create a justification along with the proposition
  doCreateJustification: !!justificationProps,
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

export const makeCreateCounterJustificationInput = (
  targetJustification: EntityOrRef<Justification> &
    Pick<Justification, "rootTargetType" | "rootTarget" | "rootPolarity">
): CreateCounterJustificationInput => ({
  rootTargetType: targetJustification.rootTargetType,
  rootTarget: targetJustification.rootTarget,
  rootPolarity: negateRootPolarity(targetJustification.rootPolarity),
  target: {
    type: "JUSTIFICATION",
    justification: toCreateJustificationInput(targetJustification),
  },
  basis: {
    type: "PROPOSITION_COMPOUND",
    propositionCompound: makeCreatePropositionCompoundInput(),
  },
  polarity: "NEGATIVE",
});

function toCreateJustificationInput(
  justification: EntityOrRef<Justification>
): CreateJustificationInput | JustificationRef {
  if (isRef(justification)) {
    return JustificationRef.parse(justification);
  }

  let justificationTarget;
  let propositionTarget;
  let statementTarget;
  switch (justification.target.type) {
    case "JUSTIFICATION":
      justificationTarget = toCreateJustificationInput(
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
      sourceExcerptBasis = toCreateSourceExcerptInput(
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

function toCreateSourceExcerptInput(
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

export const makeCreateWritQuoteInput: (
  props?: Partial<CreateWritQuoteInput>
) => CreateWritQuoteInput = makeWritQuote;
export const makeCreatePicRegionInput: (
  props?: Partial<CreatePicRegionInput>
) => CreatePicRegionInput = makePicRegion;
export const makeCreateVidSegmentInput: (
  props?: Partial<CreateVidSegmentInput>
) => CreateVidSegmentInput = makeVidSegment;

export const makeCreateContentReportInput = (
  fields: Partial<CreateContentReportInput>
): ContentReport =>
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

// TagVoteViewModel don't need a target because they are added to their targets
export type TagVoteViewModel = Omit<TagVote, "target">;

export type PropositionTagVoteViewModel = Omit<
  PropositionTagVote,
  "proposition"
>;
