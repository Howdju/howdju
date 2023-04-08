/** Types and functions relating to clients, including view models. */

import merge from "lodash/merge";
import { SetOptional } from "type-fest";
import { cloneDeep } from "lodash";

import {
  JustificationPolarity,
  newProgrammingError,
  CreateContentReportInput,
  JustificationView,
  Proposition,
  Persisted,
  JustificationRootPolarity,
  Statement,
  JustificationRootTargetOut,
  JustificationRef,
  JustificationOut,
  negateRootPolarity,
} from "howdju-common";

export function isPropositionRootTarget(
  rootTarget: JustificationRootTargetOut
): rootTarget is Persisted<Proposition> & JustificationRootTargetOut {
  return "text" in rootTarget;
}

const justificationViewDefaults = () => ({
  counterJustifications: [] as (JustificationRef | JustificationView)[],
});
type JustificationViewOverrides = SetOptional<
  JustificationView,
  keyof ReturnType<typeof justificationViewDefaults> | keyof RootTargetStuff
>;
export function makeJustificationViewModel<
  O extends JustificationViewOverrides
>(props?: O): JustificationView {
  const init = justificationViewDefaults();
  const clonedProps = cloneDeep(props);
  const merged = merge(init, clonedProps);
  const rootTargetStuff = calcRootTargetStuff(merged);
  return {
    ...merged,
    ...rootTargetStuff,
  };
}

// TODO(107): replace with Justification.rootTarget?
type RootTargetStuff = {
  rootPolarity: JustificationRootPolarity;
} & (
  | {
      rootTargetType: "PROPOSITION";
      rootTarget: Persisted<Proposition>;
    }
  | {
      rootTargetType: "STATEMENT";
      rootTarget: Persisted<Statement>;
    }
);

function calcRootTargetStuff(
  justification: JustificationViewOverrides
): RootTargetStuff {
  let targetEntity = justification.target?.entity;
  let targetType = justification.target?.type;
  let rootPolarity: JustificationPolarity = justification.polarity;
  while ("target" in targetEntity) {
    const targetJustification = targetEntity;
    rootPolarity = negateRootPolarity(targetJustification.polarity);
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

export const isVerified = (j: Pick<JustificationOut, "vote">) =>
  j.vote && j.vote.polarity === "POSITIVE";
export const isDisverified = (j: Pick<JustificationOut, "vote">) =>
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
