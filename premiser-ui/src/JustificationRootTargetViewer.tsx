import React, { ReactNode } from "react";

import {
  JustificationRootTargetTypes,
  newExhaustedEnumError,
  PropositionOut,
  StatementOut,
  ContextTrailItem,
  EntityId,
} from "howdju-common";

import PropositionEntityViewer from "./PropositionEntityViewer";
import StatementEntityViewer from "./StatementEntityViewer";
import { ComponentId, EditorId, SuggestionsKey } from "./types";
import { logger } from "./logger";
import PropositionCompoundEntityViewer from "./PropositionCompoundEntityViewer";

export type RootTargetProps =
  | {
      rootTargetType: "PROPOSITION";
      rootTargetId: EntityId;
      rootTarget: PropositionOut;
    }
  | {
      rootTargetType: "STATEMENT";
      rootTargetId: EntityId;
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
  function propositionViewer(proposition: PropositionOut) {
    return (
      <PropositionEntityViewer
        id={id}
        editorId={editorId || id}
        proposition={proposition}
        showStatusText={showStatusText}
        menu={menu}
        showJustificationCount={showJustificationCount}
      />
    );
  }
  switch (rootTargetType) {
    case "PROPOSITION": {
      // If the context of the root target is a proposition in a multi-atom compound, show it as
      // part of the compound. Otherwise show it as a proposition.

      if (!contextTrailItem) {
        return propositionViewer(rootTarget);
      }

      const { connectingEntityType, connectingEntity } = contextTrailItem;

      if (connectingEntityType === "APPEARANCE") {
        return propositionViewer(rootTarget);
      }

      if (connectingEntity.basis.type !== "PROPOSITION_COMPOUND") {
        logger.error(
          `If a root target proposition's context trail item is a Justification, it must be based on a proposition compound, but it was ${connectingEntity.basis.type}`
        );
        return propositionViewer(rootTarget);
      }

      if (
        connectingEntityType === "JUSTIFICATION" &&
        connectingEntity.basis.type === "PROPOSITION_COMPOUND" &&
        connectingEntity.basis.entity.atoms.length === 1
      ) {
        return propositionViewer(rootTarget);
      }

      return (
        <PropositionCompoundEntityViewer
          id={id}
          propositionCompound={connectingEntity.basis.entity}
          showStatusText={showStatusText}
          highlightedProposition={rootTarget}
          menu={menu}
        />
      );
    }

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
