import React, { ReactNode } from "react";

import { ContextTrailItem, PropositionOut } from "howdju-common";

import EntityViewer from "./EntityViewer";
import EditableProposition from "./EditableProposition";
import paths from "./paths";
import { ComponentId, EditorId, SuggestionsKey } from "./types";

interface Props {
  id: ComponentId;
  className?: string;
  proposition: PropositionOut;
  editorId: EditorId;
  suggestionsKey: SuggestionsKey;
  menu?: ReactNode;
  showStatusText?: boolean;
  contextTrailItems?: ContextTrailItem[];
  showJustificationCount?: boolean;
}

export default function PropositionEntityViewer({
  id,
  className,
  proposition,
  editorId,
  suggestionsKey,
  menu,
  showStatusText = true,
  contextTrailItems,
  showJustificationCount = true,
}: Props) {
  return (
    <EntityViewer
      iconName="short_text"
      iconLink={proposition && paths.proposition(proposition)}
      className={className}
      iconTitle="Proposition"
      entity={
        <EditableProposition
          id={id}
          proposition={proposition}
          editorId={editorId}
          suggestionsKey={suggestionsKey}
          showStatusText={showStatusText}
          contextTrailItems={contextTrailItems}
          showJustificationCount={showJustificationCount}
        />
      }
      menu={menu}
    />
  );
}
