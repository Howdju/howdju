/** Types and functions relating to clients, including view models. */
import merge from "lodash/merge";

import {
  ContentReport,
  ContentReportType,
  Entity,
  EntityId,
  EntityType,
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
  MaterializedEntity,
  negateRootPolarity,
  newExhaustedEnumError,
  Persisted,
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
export interface JustificationFormInputModel {
  target: JustificationTargetFormInputModel;
  polarity: JustificationPolarity;
  basis: JustificationBasisFormInputModel;
  rootTargetType: JustificationRootTargetType;
  rootTarget: JustificationRootTargetFormInputModel;
  rootPolarity: JustificationRootPolarity;
}

export interface CounterJustificationFormInputModel extends Omit<JustificationFormInputModel, "basis"> {
  basis: CounterJustificationBasisFormInputModel;
}

export interface JustificationFormSubmissionModel {
  target: JustificationTargetFormInputModel;
  polarity: JustificationPolarity;
  basis: FormSubmission<JustificationBasis>;
  rootTargetType: JustificationRootTargetType;
  rootTarget: JustificationRootTargetFormInputModel;
  rootPolarity: JustificationRootPolarity;
}

type FormSubmission<T> = T | Persisted<T>

// A root target might have just its ID.
export type JustificationRootTargetFormInputModel =
| Persisted<Proposition>
| Persisted<Statement>;

export type JustificationTargetFormInputModel =
  | JustificationTarget_Proposition_FormInputModel
  | JustificationTarget_Justification_FormInputModel
  | JustificationTarget_Statement_FormInputModel;

interface JustificationTarget_Proposition_FormInputModel {
  type: "PROPOSITION";
  entity: Proposition | Persisted<Proposition>;
}

interface JustificationTarget_Justification_FormInputModel {
  type: "JUSTIFICATION";
  entity: Justification | Persisted<Justification>;
}

interface JustificationTarget_Statement_FormInputModel {
  type: "STATEMENT";
  entity: Statement | Persisted<Statement>;
}

export interface JustificationBasisFormInputModel {
  type: JustificationBasisType;
  propositionCompound: PropositionCompoundFormInputModel;
  /** @deprecated use {@link sourceExcerpt} instead. */
  writQuote: WritQuoteFormInputModel;
  sourceExcerpt: SourceExcerptFormInputModel;
}

export interface CounterJustificationBasisFormInputModel
  extends Omit<JustificationBasisFormInputModel, "writQuote" | "sourceExcerpt"> {}

export type PropositionCompoundFormInputModel = PropositionCompound;
export type WritQuoteFormInputModel = WritQuote;
export type VidSegmentFormInputModel = VidSegment;
export type PicRegionFormInputModel = PicRegion;

export interface SourceExcerptFormInputModel {
  type: SourceExcerptType;
  writQuote: WritQuote;
  picRegion: PicRegion;
  vidSegment: VidSegment;
}

export type PropositionFormInputModel = Proposition;

export interface JustificationViewModel extends Materialized<Justification> {
  /** The current user's vote on this justification. */
  vote?: JustificationVote;
  // The sorting score for the current user
  score?: number
  // Justifications countering this justification.
  counterJustifications: JustificationViewModel[]
}

export type JustificationRootTargetViewModel = Materialized<JustificationRootTarget> & TaggedEntityViewModel & {
  justifications: JustificationViewModel[]
  // TODO make tags a view model and put the votes on them.
  // TODO (At the very least deduplicate between TaggedEntityViewModel.tagVotes)
  propositionTagVotes: PropositionTagVoteViewModel[]
}

export interface TaggedEntityViewModel extends Entity {
  tags: Tag[]
  // TODO put votes on tags and type it as a viewmodel
  tagVotes: TagVoteViewModel[]
  recommendedTags: Tag[]
}

export interface JustificationVote extends Vote {
  polarity: JustificationVotePolarity;
}

export interface Vote {}

export const makeJustificationFormInputModel = (
  props: Partial<JustificationFormInputModel>
): JustificationFormInputModel => {
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
        propositionCompound: makePropositionCompoundFormInputModel(),
        sourceExcerpt: makeSourceExcerptFormInputModel(),
        writQuote: makeWritQuoteFormInputModel(),
      },
    },
    props
  ) as JustificationFormInputModel;

  inferJustificationRootTarget(justificationInput);

  return justificationInput;
};

export const makeJustificationViewModel = (props?: MaterializedEntity & Partial<JustificationViewModel>): JustificationViewModel => {
  const init = {
    rootTarget: {},
    rootTargetType: JustificationRootTargetTypes.PROPOSITION,
    rootPolarity: JustificationRootPolarities.POSITIVE,
    target: {},
    polarity: JustificationPolarities.POSITIVE,
    basis: {},
    counterJustifications: [],
  }
  const merged = merge(init, props)
  inferJustificationRootTarget(merged)
  return merged
}

export function makeSourceExcerptFormInputModel(
  props?: Partial<SourceExcerptFormInputModel>
): SourceExcerptFormInputModel {
  return merge(
    {
      type: SourceExcerptTypes.WRIT_QUOTE,
      writQuote: makeWritQuoteFormInputModel(),
      picRegion: makePicRegionFormInputModel(),
      vidSegment: makeVidSegmentFormInputModel(),
    },
    props
  );
}

export function makeVidSegmentFormInputModel(): VidSegmentFormInputModel {
  return makeVidSegment();
}

export function makeWritQuoteFormInputModel(): WritQuoteFormInputModel {
  return makeWritQuote();
}

export function makePicRegionFormInputModel(): PicRegionFormInputModel {
  return makePicRegion();
}

export function makePropositionCompoundFormInputModel(): PropositionCompoundFormInputModel {
  return {
    atoms: [{ entity: makePropositionFormInputModel() }],
  };
}

export function makePropositionFormInputModel(): PropositionFormInputModel {
  return makeProposition();
}

function inferJustificationRootTarget(
  justification: JustificationFormInputModel | JustificationViewModel
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
  justification.rootTarget =
    targetEntity as JustificationRootTargetFormInputModel;
  justification.rootPolarity = rootPolarity;
}

export const isVerified = (j: JustificationViewModel) =>
  j.vote && j.vote.polarity === JustificationVotePolarities.POSITIVE;
export const isDisverified = (j: JustificationViewModel) =>
  j.vote && j.vote.polarity === JustificationVotePolarities.NEGATIVE;

// TODO(1): must we export this? Where will we use it?
export function convertSourceExcerptToFormInputModel(
  sourceExcerpt: SourceExcerpt
): SourceExcerptFormInputModel {
  const formModel = makeSourceExcerptFormInputModel(sourceExcerpt);
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

export interface CreatePropositionFormInputModel {}

export const makeJustifiedPropositionFormInputModel = (
  propositionProps: Partial<PropositionFormInputModel>,
  justificationProps: Partial<JustificationFormInputModel>
): CreatePropositionFormInputModel => ({
  proposition: makeProposition(propositionProps),
  speakers: [],
  justification: makeJustificationFormInputModel(justificationProps),
  // whether to have the justification controls expanded and to create a justification along with the proposition
  doCreateJustification: !!justificationProps,
});

/** Trunk justifications directly target the root */
export const makeJustificationFormInputModelTargetingRoot = (
  targetType: JustificationRootTargetType & JustificationTargetType,
  targetId: EntityId,
  polarity?: JustificationPolarity
): JustificationFormInputModel =>
  makeJustificationFormInputModel({
    rootTargetType: targetType,
    rootTarget: { id: targetId },
    polarity,
    target: { type: targetType, entity: { id: targetId } },
  });

export const makeCounterJustification = (
  targetJustification: Persisted<Justification> & Pick<Justification, "rootTargetType" | "rootTarget" | "rootPolarity">
): CounterJustificationFormInputModel => ({
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

export interface ContentReportFormInputModel {
  entityType: EntityType;
  entityId: EntityId;
  // Map of whether a particular content type is selected
  checkedByType: Map<ContentReportType, boolean>;
  description: "";
  url: string;
}

export const makeContentReportFormInputModel = (
  fields: Partial<ContentReportFormInputModel>
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
  polarity: TagVotePolarity
  tag: Tag
}

export interface PropositionTagVoteViewModel extends Omit<PropositionTagVote, "proposition"> {}
