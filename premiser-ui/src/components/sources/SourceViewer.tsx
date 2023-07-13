import React from "react";
import cn from "classnames";
import { SourceOut } from "howdju-common";
import { ComponentId } from "@/types";
import { UserBlurbViewer } from "../users/UserBlurbViewer";

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
  return (
    <div {...rest} id={id} className={cn(className, "source-viewer")}>
      <div className="source">
        <div className="source-description">{source?.description}</div>
        <div>
          Created by <UserBlurbViewer user={source?.creator} /> on{" "}
          {source?.created}
        </div>
      </div>
    </div>
  );
}
