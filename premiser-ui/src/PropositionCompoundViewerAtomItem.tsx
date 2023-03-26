import React from "react";
import cn from "classnames";

import { ContextTrailItem, PropositionCompoundAtomOut } from "howdju-common";

import { combineIds, combineSuggestionsKeys } from "./viewModels";
import PropositionEntityViewer from "./PropositionEntityViewer";

import "./PropositionCompoundViewerAtomItem.scss";
import { ComponentId } from "./types";

interface Props {
  id: ComponentId;
  atom: PropositionCompoundAtomOut;
  isHighlighted: boolean;
  showStatusText?: boolean;
  contextTrailItems?: ContextTrailItem[];
  showJustificationCount?: boolean;
}

export default function PropositionCompoundViewerAtomItem({
  id,
  atom,
  isHighlighted,
  showStatusText = true,
  contextTrailItems,
  showJustificationCount = true,
}: Props) {
  return (
    <li
      id={id}
      className={cn("compound-atom proposition-atom", {
        highlighted: isHighlighted,
      })}
    >
      <PropositionEntityViewer
        id={combineIds(id, "proposition")}
        proposition={atom.entity}
        editorId={combineIds(id, "proposition")}
        suggestionsKey={combineSuggestionsKeys(id, "proposition")}
        showStatusText={showStatusText}
        contextTrailItems={contextTrailItems}
        showJustificationCount={showJustificationCount}
      />
    </li>
  );
}
