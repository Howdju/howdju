import React, { ReactNode } from "react";

import {
  JustificationRootTargetTypes,
  newExhaustedEnumError,
  PropositionOut,
  StatementOut,
  ContextTrailItem,
} from "howdju-common";

import PropositionEntityViewer from "./PropositionEntityViewer";
import StatementEntityViewer from "./StatementEntityViewer";
import { ComponentId, EditorId, SuggestionsKey } from "./types";
import PropositionCompoundViewer from "./PropositionCompoundViewer";
import { logger } from "./logger";

export type RootTargetProps =
  | {
      rootTargetType: "PROPOSITION";
      rootTarget: PropositionOut;
    }
  | {
      rootTargetType: "STATEMENT";
      rootTarget: StatementOut;
    };
type Props = {
  id: ComponentId;
  editorId?: EditorId;
  suggestionsKey?: SuggestionsKey;
  showStatusText?: boolean;
  menu?: ReactNode;
  contextTrailItem?: ContextTrailItem;
  showJustificationCount?: boolean;
} & RootTargetProps;

export default function JustificationRootTargetViewer({
  id,
  editorId,
  rootTargetType,
  rootTarget,
  suggestionsKey,
  showStatusText = true,
  menu,
  contextTrailItem,
  showJustificationCount = true,
}: Props) {
  switch (rootTargetType) {
    case "PROPOSITION":
      if (contextTrailItem) {
        const { connectingEntityType, connectingEntity } = contextTrailItem;
        // If the root target is a proposition that was part of a compound in the context, display
        // it as part of the compound.
        if (
          connectingEntityType === "JUSTIFICATION" &&
          connectingEntity.basis.type === "PROPOSITION_COMPOUND" &&
          connectingEntity.basis.entity.atoms.length > 1
        ) {
          return (
            <PropositionCompoundViewer
              id={id}
              propositionCompound={connectingEntity.basis.entity}
              showStatusText={showStatusText}
              highlightedProposition={rootTarget}
            />
          );
        }
        logger.error(
          `A root target proposition's context trail item must be based on a proposition compound, but it was ${connectingEntity.basis.type}`
        );
        // fallthrough to default return
      }
      return (
        <PropositionEntityViewer
          id={id}
          editorId={editorId || id}
          proposition={rootTarget}
          showStatusText={showStatusText}
          menu={menu}
          showJustificationCount={showJustificationCount}
        />
      );
    case JustificationRootTargetTypes.STATEMENT:
      return (
        <StatementEntityViewer
          id={id}
          statement={rootTarget}
          suggestionsKey={suggestionsKey}
          showStatusText={showStatusText}
          menu={menu}
          showJustificationCount={showJustificationCount}
        />
      );
    default:
      throw newExhaustedEnumError(rootTargetType);
  }
}
