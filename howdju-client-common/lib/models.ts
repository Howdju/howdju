/** Types and functions relating to clients, including view models. */

import merge from "lodash/merge";
import { SetOptional } from "type-fest";
import { cloneDeep } from "lodash";

import {
  JustificationPolarity,
  JustificationRootTarget,
  makeProposition,
  makeSourceExcerpt,
  newProgrammingError,
  SourceExcerptParaphrase,
  CreateContentReportInput,
  PropositionTagVoteOut,
  JustificationOut,
  Proposition,
  TaggedEntityOut,
  Persisted,
  JustificationRootTargetType,
  JustificationRootPolarity,
} from "howdju-common";

// TODO either rename to JustificationRootTargetRef, replace justifications with hasAgreement and
// hasDisagreement. Or replace with non-persisted version to allow drafting of justification trees.
export type JustificationRootTargetViewModel = JustificationRootTarget &
  TaggedEntityOut & {
    justifications: JustificationOut[];
    // TODO make tags a view model and put the votes on them.
    // TODO (At the very least deduplicate between TaggedEntityViewModel.tagVotes)
    propositionTagVotes: PropositionTagVoteOut[];
  };

export function isPropositionRootTarget(
  rootTarget: JustificationRootTargetViewModel
): rootTarget is Persisted<Proposition> & JustificationRootTargetViewModel {
  return "text" in rootTarget;
}

const justificationViewModelDefaults = () => ({
  counterJustifications: [],
});
export function makeJustificationOutModel(
  props?: SetOptional<
    JustificationOut,
    | keyof ReturnType<typeof justificationViewModelDefaults>
    | keyof RootTargetStuff
  >
): JustificationOut {
  const init = justificationViewModelDefaults();
  const merged = merge(init, props);
  const rootTargetStuff = calcRootTargetStuff(merged);
  return { ...cloneDeep(merged), ...rootTargetStuff } as JustificationOut;
}

type RootTargetStuff = {
  rootTargetType: JustificationRootTargetType;
  rootTarget: JustificationRootTarget;
  rootPolarity: JustificationRootPolarity;
};

function calcRootTargetStuff(
  justification: SetOptional<
    JustificationOut,
    | keyof ReturnType<typeof justificationViewModelDefaults>
    | keyof RootTargetStuff
  >
): RootTargetStuff {
  let targetEntity = justification.target?.entity;
  let targetType = justification.target?.type;
  let rootPolarity: JustificationPolarity = justification.polarity;
  while ("target" in targetEntity) {
    const targetJustification = targetEntity;
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
    rootTargetType,
    rootTarget,
    rootPolarity,
  };
}

export const isVerified = (j: JustificationOut) =>
  j.vote && j.vote.polarity === "POSITIVE";
export const isDisverified = (j: JustificationOut) =>
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
