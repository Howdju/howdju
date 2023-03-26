/** Types and functions relating to clients, including view models. */

import merge from "lodash/merge";
import { SetOptional } from "type-fest";
import { cloneDeep } from "lodash";

import {
  JustificationPolarity,
  newProgrammingError,
  CreateContentReportInput,
  JustificationOut,
  Proposition,
  Persisted,
  JustificationRootPolarity,
  Statement,
  JustificationRootTargetOut,
} from "howdju-common";

export function isPropositionRootTarget(
  rootTarget: JustificationRootTargetOut
): rootTarget is Persisted<Proposition> & JustificationRootTargetOut {
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
export function makeJustificationOutModel<O extends JustificationOutOverrides>(
  props?: O
): O & JustificationOut {
  const init = justificationViewModelDefaults();
  const merged = merge(init, props);
  const rootTargetStuff = calcRootTargetStuff(merged);
  return { ...cloneDeep(merged), ...rootTargetStuff };
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
