import React from "react";
import { Link } from "react-router-dom";
import cn from "classnames";
import moment from "moment";

import { WritOut } from "howdju-common";

import paths from "./paths";
import { ComponentId } from "./types";
import { formatTimestampForDisplay } from "./util";

interface Props {
  id: ComponentId;
  writ: WritOut;
  className?: string;
  showStatusText?: boolean;
}

export default function WritViewer({
  id,
  writ,
  className,
  showStatusText,
  ...rest
}: Props) {
  const age = writ.created ? moment(writ.created).fromNow() : "";
  const created = writ.created ? formatTimestampForDisplay(writ.created) : "";

  return (
    <div {...rest} id={id} className={cn(className, "writ-viewer")}>
      {writ && (
        <div>
          <div className="writ-text">
            <Link to={paths.searchJustifications({ writId: writ.id })}>
              {writ.title}
            </Link>
          </div>
          {showStatusText && (
            <div className="entity-status-text">
              created <span title={created}>{age}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
