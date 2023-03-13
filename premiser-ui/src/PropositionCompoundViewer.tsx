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
  contextTrailItems: ContextTrailItem[];
  doShowControls?: boolean;
  doShowAtomJustifications?: boolean;
  isCondensed?: boolean;
  showStatusText?: boolean;
  isUnCondensed?: boolean;
  showBasisUrls?: boolean;
  showJustificationCount: boolean;
}

export default function PropositionCompoundViewer({
  id,
  propositionCompound,
  highlightedProposition,
  contextTrailItems,
  doShowControls,
  doShowAtomJustifications,
  isCondensed,
  isUnCondensed,
  showBasisUrls,
  showStatusText,
  showJustificationCount,
  ...rest
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
        doShowControls={doShowControls}
        doShowJustifications={doShowAtomJustifications}
        isCondensed={isCondensed}
        isUnCondensed={isUnCondensed}
        showBasisUrls={showBasisUrls}
        showStatusText={showStatusText}
        contextTrailItems={contextTrailItems}
      />
    );
  });

  return (
    <ol {...rest} className="compound-viewer proposition-compound-viewer">
      {atomListItems}
    </ol>
  );
}
