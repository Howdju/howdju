import React from "react";

import EntityViewer from "./EntityViewer";
import PropositionCompoundViewer from "./PropositionCompoundViewer";
import { ComponentId } from "./types";
import {
  ContextTrailItem,
  PropositionCompoundOut,
  PropositionOut,
} from "howdju-common";

interface Props {
  id: ComponentId;
  propositionCompound: PropositionCompoundOut;
  contextTrailItems: ContextTrailItem[];
  highlightedProposition?: PropositionOut;
  showStatusText?: boolean;
  showJustificationCount?: boolean;
  className?: string;
}

export default function PropositionCompoundEntityViewer({
  id,
  className = "",
  propositionCompound,
  highlightedProposition,
  showStatusText = true,
  contextTrailItems,
  showJustificationCount = true,
}: Props) {
  return (
    <EntityViewer
      iconName="short_text"
      className={className}
      iconTitle="Proposition compound"
      entity={
        <PropositionCompoundViewer
          id={id}
          propositionCompound={propositionCompound}
          highlightedProposition={highlightedProposition}
          showStatusText={showStatusText}
          contextTrailItems={contextTrailItems}
          showJustificationCount={showJustificationCount}
        />
      }
    />
  );
}
