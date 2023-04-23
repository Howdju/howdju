import React from "react";
import cn from "classnames";
import { PersorgOut } from "howdju-common";
import { ComponentId } from "./types";

interface Props {
  id: ComponentId;
  persorg?: PersorgOut;
  className?: string;
}

export default function PersorgViewer({
  id,
  persorg,
  className,
  ...rest
}: Props) {
  return (
    <div {...rest} id={id} className={cn(className, "persorg-viewer")}>
      {persorg && (
        <div className="persorg-viewer">
          <div className="persorg-name">{persorg.name}</div>
        </div>
      )}
    </div>
  );
}
