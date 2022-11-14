/** Types and functions relating to clients, including view models. */
import merge from "lodash/merge";

import {
  ContentReport,
  ContentReportType,
  Entity,
  EntityId,
  EntityType,
  FactoryInput,
  Justification,
  JustificationBasis,
  JustificationBasisType,
  JustificationBasisTypes,
  JustificationPolarities,
  JustificationPolarity,
  JustificationRootPolarities,
  JustificationRootPolarity,
  JustificationRootTarget,
  JustificationRootTargetType,
  JustificationRootTargetTypes,
  JustificationTargetType,
  JustificationTargetTypes,
  JustificationVotePolarities,
  JustificationVotePolarity,
  makePicRegion,
  makeProposition,
  makePropositionCompound,
  makeSourceExcerpt,
  makeVidSegment,
  makeWritQuote,
  Materialized,
  negateRootPolarity,
  newExhaustedEnumError,
  Persisted,
  Persorg,
  PicRegion,
  Proposition,
  PropositionCompound,
  PropositionTagVote,
  SourceExcerpt,
  SourceExcerptParaphrase,
  SourceExcerptType,
  SourceExcerptTypes,
  Statement,
  Tag,
  TagVotePolarity,
  VidSegment,
  WritQuote,
} from "howdju-common";

/** A view model for creating a new justification.
 *
 * Supports edits to alternative bases at the same time (whereas a materialized Justification can
 * have just one basis type.) This used to be called a NewJustification.
 */
export interface JustificationEditModel {
  target: JustificationTargetEditModel;
  polarity: JustificationPolarity;
  basis: JustificationBasisEditModel;
  rootTargetType: JustificationRootTargetType;
  rootTarget: JustificationRootTargetEditModel;
  rootPolarity: JustificationRootPolarity;
}

export interface CounterJustificationEditModel
  extends Omit<JustificationEditModel, "basis"> {
  basis: CounterJustificationBasisEditModel;
}

export interface JustificationSubmissionModel {
  target: JustificationTargetEditModel;
  polarity: JustificationPolarity;
  basis: FormSubmission<JustificationBasis>;
  rootTargetType: JustificationRootTargetType;
  rootTarget: JustificationRootTargetEditModel;
  rootPolarity: JustificationRootPolarity;
}

type FormSubmission<T> = T | Persisted<T>;

// A root target might have just its ID.
export type JustificationRootTargetEditModel =
  | Persisted<Proposition>
  | Persisted<Statement>;

export type JustificationTargetEditModel =
  | JustificationTarget_Proposition_EditModel
  | JustificationTarget_Justification_EditModel
  | JustificationTarget_Statement_EditModel;

interface JustificationTarget_Proposition_EditModel {
  type: "PROPOSITION";
  entity: Proposition | Persisted<Proposition>;
}

interface JustificationTarget_Justification_EditModel {
  type: "JUSTIFICATION";
  entity: Justification | Persisted<Justification>;
}

interface JustificationTarget_Statement_EditModel {
  type: "STATEMENT";
  entity: Statement | Persisted<Statement>;
}

export interface JustificationBasisEditModel {
  type: JustificationBasisType;
  propositionCompound: PropositionCompoundEditModel;
  /** @deprecated use {@link sourceExcerpt} instead. */
  writQuote: WritQuoteEditModel;
  sourceExcerpt: SourceExcerptEditModel;
}

export type CounterJustificationBasisEditModel = Omit<
  JustificationBasisEditModel,
  "writQuote" | "sourceExcerpt"
>;

export type PropositionCompoundEditModel = PropositionCompound;
export type WritQuoteEditModel = WritQuote;
export type VidSegmentEditModel = VidSegment;
export type PicRegionEditModel = PicRegion;

export interface SourceExcerptEditModel {
  type: SourceExcerptType;
  writQuote: WritQuote;
  picRegion: PicRegion;
  vidSegment: VidSegment;
}

export type PropositionEditModel = Proposition;

export interface JustificationViewModel extends Materialized<Justification> {
  /** The current user's vote on this justification. */
  vote?: JustificationVote;
  // The sorting score for the current user
  score?: number;
  // Justifications countering this justification.
  counterJustifications: JustificationViewModel[];
}

export type JustificationRootTargetViewModel =
  Materialized<JustificationRootTarget> &
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

export interface JustificationVote {
  polarity: JustificationVotePolarity;
}

export const makeJustificationEditModel = (
  props: Partial<JustificationEditModel>
): JustificationEditModel => {
  const justificationInput = merge(
    {
      rootTargetType: JustificationRootTargetTypes.PROPOSITION,
      rootTarget: { id: null },
      polarity: JustificationPolarities.POSITIVE,
      rootPolarity: JustificationRootPolarities.POSITIVE,
      target: {
        type: JustificationTargetTypes.PROPOSITION,
        entity: {
          id: null,
        },
      },
      basis: {
        type: JustificationBasisTypes.PROPOSITION_COMPOUND,
        propositionCompound: makePropositionCompoundEditModel(),
        sourceExcerpt: makeSourceExcerptEditModel(),
        writQuote: makeWritQuoteEditModel(),
      },
    },
    props
  ) as JustificationEditModel;

  inferJustificationRootTarget(justificationInput);

  return justificationInput;
};

export const makeJustificationViewModel = (
  props?: FactoryInput<
    JustificationViewModel,
    "id" | "rootTarget",
    "target" | "basis"
  >
): JustificationViewModel => {
  const init = {
    rootTargetType: JustificationRootTargetTypes.PROPOSITION,
    rootPolarity: JustificationRootPolarities.POSITIVE,
    polarity: JustificationPolarities.POSITIVE,
    counterJustifications: [],
  };
  const merged: JustificationViewModel = merge(init, props);
  inferJustificationRootTarget(merged);
  return merged;
};

export function makeSourceExcerptEditModel(
  props?: Partial<SourceExcerptEditModel>
): SourceExcerptEditModel {
  return merge(
    {
      type: SourceExcerptTypes.WRIT_QUOTE,
      writQuote: makeWritQuoteEditModel(),
      picRegion: makePicRegionEditModel(),
      vidSegment: makeVidSegmentEditModel(),
    },
    props
  );
}

export function makeVidSegmentEditModel(): VidSegmentEditModel {
  return makeVidSegment();
}

export function makeWritQuoteEditModel(): WritQuoteEditModel {
  return makeWritQuote();
}

export function makePicRegionEditModel(): PicRegionEditModel {
  return makePicRegion();
}

export function makePropositionCompoundEditModel(): PropositionCompoundEditModel {
  return {
    atoms: [{ entity: makePropositionEditModel() }],
  };
}

export function makePropositionEditModel(): PropositionEditModel {
  return makeProposition();
}

function inferJustificationRootTarget(
  justification: JustificationEditModel | JustificationViewModel
) {
  let targetEntity = justification.target.entity;
  let targetType = justification.target.type;
  let rootPolarity = justification.polarity;
  while ("target" in targetEntity) {
    const targetJustification = targetEntity as Justification;
    rootPolarity = targetJustification.polarity;
    targetType = targetJustification.target.type;
    targetEntity = targetJustification.target.entity;
  }
  justification.rootTargetType = targetType;
  justification.rootTarget = targetEntity as JustificationRootTargetEditModel;
  justification.rootPolarity = rootPolarity;
}

export const isVerified = (j: JustificationViewModel) =>
  j.vote && j.vote.polarity === JustificationVotePolarities.POSITIVE;
export const isDisverified = (j: JustificationViewModel) =>
  j.vote && j.vote.polarity === JustificationVotePolarities.NEGATIVE;

// TODO(1): must we export this? Where will we use it?
export function convertSourceExcerptToEditModel(
  sourceExcerpt: SourceExcerpt
): SourceExcerptEditModel {
  const formModel = makeSourceExcerptEditModel(sourceExcerpt);
  switch (sourceExcerpt.type) {
    case SourceExcerptTypes.WRIT_QUOTE:
      formModel.writQuote = sourceExcerpt.entity;
      break;
    case SourceExcerptTypes.PIC_REGION:
      formModel.picRegion = sourceExcerpt.entity;
      break;
    case SourceExcerptTypes.VID_SEGMENT:
      formModel.vidSegment = sourceExcerpt.entity;
      break;
    default:
      throw newExhaustedEnumError(sourceExcerpt);
  }
  return formModel;
}

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

export interface CreatePropositionEditModel {
  proposition: Proposition;
  speakers: Persorg[];
  justification: JustificationEditModel;
  doCreateJustification: boolean;
}

export const makeJustifiedPropositionEditModel = (
  propositionProps: Partial<PropositionEditModel>,
  justificationProps: Partial<JustificationEditModel>
): CreatePropositionEditModel => ({
  proposition: makeProposition(propositionProps),
  speakers: [],
  justification: makeJustificationEditModel(justificationProps),
  // whether to have the justification controls expanded and to create a justification along with the proposition
  doCreateJustification: !!justificationProps,
});

/** Trunk justifications directly target the root */
export const makeJustificationEditModelTargetingRoot = (
  targetType: JustificationRootTargetType & JustificationTargetType,
  targetId: EntityId,
  polarity?: JustificationPolarity
): JustificationEditModel =>
  makeJustificationEditModel({
    rootTargetType: targetType,
    rootTarget: { id: targetId },
    polarity,
    target: { type: targetType, entity: { id: targetId } },
  });

export const makeCounterJustification = (
  targetJustification: Persisted<Justification> &
    Pick<Justification, "rootTargetType" | "rootTarget" | "rootPolarity">
): CounterJustificationEditModel => ({
  rootTargetType: targetJustification.rootTargetType,
  rootTarget: { id: targetJustification.rootTarget.id },
  rootPolarity: negateRootPolarity(targetJustification.rootPolarity),
  target: {
    type: JustificationTargetTypes.JUSTIFICATION,
    entity: targetJustification,
  },
  basis: {
    type: JustificationBasisTypes.PROPOSITION_COMPOUND,
    propositionCompound: makePropositionCompound(),
  },
  polarity: JustificationPolarities.NEGATIVE,
});

export interface ContentReportEditModel {
  entityType: EntityType;
  entityId: EntityId;
  // Map of whether a particular content type is selected
  checkedByType: Map<ContentReportType, boolean>;
  description: "";
  url: string;
}

export const makeContentReportEditModel = (
  fields: Partial<ContentReportEditModel>
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

export interface TagVoteViewModel extends Entity {
  // TagVoteViewModel don't need a target because they are added to their targets
  polarity: TagVotePolarity;
  tag: Tag;
}

export type PropositionTagVoteViewModel = Omit<
  PropositionTagVote,
  "proposition"
>;
