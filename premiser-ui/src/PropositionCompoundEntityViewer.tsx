import React, { ReactNode } from "react";

import EntityViewer from "./EntityViewer";
import PropositionCompoundViewer from "./PropositionCompoundViewer";
import { ComponentId } from "./types";
import {
  ContextTrailItem,
  PropositionCompoundOut,
  PropositionOut,
} from "howdju-common";
import { MaterialSymbol } from "react-material-symbols";

interface Props {
  id: ComponentId;
  propositionCompound: PropositionCompoundOut;
  contextTrailItems?: ContextTrailItem[];
  highlightedProposition?: PropositionOut;
  showStatusText?: boolean;
  showJustificationCount?: boolean;
  className?: string;
  menu?: ReactNode;
}

export default function PropositionCompoundEntityViewer({
  id,
  className = "",
  propositionCompound,
  highlightedProposition,
  showStatusText = true,
  contextTrailItems,
  showJustificationCount = true,
  menu,
}: Props) {
  return (
    <EntityViewer
      icon={<MaterialSymbol icon="list" />}
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
      menu={menu}
    />
  );
}
