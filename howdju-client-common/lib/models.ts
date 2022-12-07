/** Types and functions relating to clients, including view models. */
import merge from "lodash/merge";

import {
  ContentReport,
  Entity,
  FactoryInput,
  Justification,
  JustificationPolarity,
  JustificationRootTarget,
  makeProposition,
  makeSourceExcerpt,
  newProgrammingError,
  Persisted,
  Proposition,
  PropositionTagVote,
  Ref,
  SourceExcerptParaphrase,
  Tag,
  EntityName,
  JustificationVote,
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

export const isVerified = (j: JustificationViewModel) =>
  j.vote && j.vote.polarity === "POSITIVE";
export const isDisverified = (j: JustificationViewModel) =>
  j.vote && j.vote.polarity === "NEGATIVE";

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
