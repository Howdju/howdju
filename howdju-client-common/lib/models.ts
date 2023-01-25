/** Types and functions relating to clients, including view models. */

import merge from "lodash/merge";
import { SetOptional } from "type-fest";
import { cloneDeep } from "lodash";

import {
  JustificationPolarity,
  JustificationRootTarget,
  newProgrammingError,
  CreateContentReportInput,
  PropositionTagVoteOut,
  JustificationOut,
  Proposition,
  TaggedEntityOut,
  Persisted,
  JustificationRootPolarity,
  Statement,
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
type JustificationOutOverrides = SetOptional<
  JustificationOut,
  | keyof ReturnType<typeof justificationViewModelDefaults>
  | keyof RootTargetStuff
>;
export function makeJustificationOutModel(
  props?: JustificationOutOverrides
): JustificationOut {
  const init = justificationViewModelDefaults();
  const merged = merge(init, props);
  const rootTargetStuff = calcRootTargetStuff(merged);
  return { ...cloneDeep(merged), ...rootTargetStuff } as JustificationOut;
}

// TODO(107): replace with Justification.rootTarget?
type RootTargetStuff =
  | {
      rootTargetType: "PROPOSITION";
      rootTarget: Persisted<Proposition>;
      rootPolarity: JustificationRootPolarity;
    }
  | {
      rootTargetType: "STATEMENT";
      rootTarget: Persisted<Statement>;
      rootPolarity: JustificationRootPolarity;
    };

function calcRootTargetStuff(
  justification: JustificationOutOverrides
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
      "Unable to infer justification root target because we ended up at a justification."
    );
  }
  const rootTargetType = targetType;
  const rootTarget = targetEntity;
  return {
    rootTargetType,
    rootTarget,
    rootPolarity,
  } as RootTargetStuff;
}

export const isVerified = (j: JustificationOut) =>
  j.vote && j.vote.polarity === "POSITIVE";
export const isDisverified = (j: JustificationOut) =>
  j.vote && j.vote.polarity === "NEGATIVE";

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
