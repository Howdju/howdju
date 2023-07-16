import React from "react";
import cn from "classnames";
import { SourceOut } from "howdju-common";
import { ComponentId } from "@/types";
import CreationInfo from "../creationInfo/CreationInfo";

interface Props {
  id: ComponentId;
  source?: SourceOut;
  className?: string;
}

export default function SourceViewer({
  id,
  source,
  className,
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
        <CreationInfo created={created} creator={creator} />
      </div>
    </div>
  );
}
