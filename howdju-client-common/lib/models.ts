/** Types and functions relating to clients, including view models. */

import merge from "lodash/merge";
import { SetOptional } from "type-fest";
import { cloneDeep } from "lodash";

import {
  Justification,
  JustificationPolarity,
  JustificationRootTarget,
  makeProposition,
  makeSourceExcerpt,
  newProgrammingError,
  Persisted,
  SourceExcerptParaphrase,
  CreateContentReportInput,
  TaggedEntityViewModel,
  PropositionTagVoteViewModel,
  JustificationOutModel,
} from "howdju-common";

// TODO either rename to JustificationRootTargetRef, replace justifications with hasAgreement and
// hasDisagreement. Or replace with non-persisted version to allow drafting of justification trees.
export type JustificationRootTargetViewModel =
  Persisted<JustificationRootTarget> &
    TaggedEntityViewModel & {
      justifications: JustificationOutModel[];
      // TODO make tags a view model and put the votes on them.
      // TODO (At the very least deduplicate between TaggedEntityViewModel.tagVotes)
      propositionTagVotes: PropositionTagVoteViewModel[];
    };

type UnrootedJustificationViewModel = Omit<
  JustificationOutModel,
  "rootTarget" | "rootTargetType" | "rootPolarity"
>;
const justificationViewModelDefaults = () => ({
  counterJustifications: [],
});
export function makeJustificationOutModel(
  props?: SetOptional<
    UnrootedJustificationViewModel,
    keyof ReturnType<typeof justificationViewModelDefaults>
  >
): JustificationOutModel {
  const init = justificationViewModelDefaults();
  const merged = merge(init, props);
  return inferJustificationRootTarget(merged);
}

function inferJustificationRootTarget(
  justification: UnrootedJustificationViewModel
): JustificationOutModel {
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
      "Unable to infer justification root target. We ended up at a justification."
    );
  }
  const rootTargetType = targetType;
  const rootTarget = targetEntity as JustificationRootTarget;
  return {
    ...cloneDeep(justification),
    rootTargetType,
    rootTarget,
    rootPolarity,
  } as JustificationOutModel;
}

export const isVerified = (j: JustificationOutModel) =>
  j.vote && j.vote.polarity === "POSITIVE";
export const isDisverified = (j: JustificationOutModel) =>
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

export const makeCreateContentReportInput = (
  fields: Partial<CreateContentReportInput>
): CreateContentReportInput =>
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
