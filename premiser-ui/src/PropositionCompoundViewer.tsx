import React from "react";
import map from "lodash/map";

import PropositionCompoundViewerAtomItem from "./PropositionCompoundViewerAtomItem";
import { combineIds } from "./viewModels";
import {
  ContextTrailItem,
  PropositionCompoundOut,
  PropositionOut,
} from "howdju-common";
import { ComponentId } from "./types";

interface Props {
  /** Required for the CircularProgress */
  id: ComponentId;
  propositionCompound: PropositionCompoundOut;
  highlightedProposition?: PropositionOut;
  contextTrailItems?: ContextTrailItem[];
  showStatusText?: boolean;
  showJustificationCount?: boolean;
}

export default function PropositionCompoundViewer({
  id,
  propositionCompound,
  highlightedProposition,
  contextTrailItems,
  showStatusText,
  showJustificationCount = false,
}: Props) {
  const atomListItems = map(propositionCompound.atoms, (atom) => {
    const listItemId = combineIds(
      id,
      `proposition-atom-${atom.entity.id}`,
      "list-item"
    );
    const isHighlighted = atom.entity.id === highlightedProposition?.id;
    return (
      <PropositionCompoundViewerAtomItem
        id={listItemId}
        key={listItemId}
        atom={atom}
        isHighlighted={isHighlighted}
        showStatusText={showStatusText}
        contextTrailItems={contextTrailItems}
        showJustificationCount={showJustificationCount}
      />
    );
  });

  return (
    <ol className="compound-viewer proposition-compound-viewer">
      {atomListItems}
    </ol>
  );
}