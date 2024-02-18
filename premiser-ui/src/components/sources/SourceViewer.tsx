import React from "react";
import cn from "classnames";
import { ContextTrailItem, SourceOut } from "howdju-common";
import { ComponentId } from "@/types";
import CreationInfo from "../creationInfo/CreationInfo";

interface Props {
  id: ComponentId;
  source?: SourceOut;
  className?: string;
  showStatusText?: boolean;
  contextTrailItems?: ContextTrailItem[];
}

export default function SourceViewer({
  id,
  source,
  className,
  showStatusText = true,
  // SourceViewer doesn't currently use the context trail
  contextTrailItems: _contextTrailItems,
  ...rest
}: Props) {
  if (!source) {
    return null;
  }
  const { description, created, creator } = source;
  return (
    <div {...rest} id={id} className={cn(className, "source-viewer")}>
      <div className="source">
        <div className="source-description">{description}</div>
        {showStatusText ? (
          <CreationInfo created={created} creator={creator} />
        ) : null}
      </div>
    </div>
  );
}
