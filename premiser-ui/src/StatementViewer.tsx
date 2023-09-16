import React from "react";
import { CircularProgress } from "react-md";
import { Link } from "react-router-dom";
import cn from "classnames";
import get from "lodash/get";
import moment from "moment";

import {
  ContextTrailItem,
  JustificationRootTargetTypes,
  StatementOut,
} from "howdju-common";

import config from "./config";
import JustificationCountViewer from "./JustificationCountViewer";
import paths from "./paths";
import { combineIds, describeRootTarget } from "./viewModels";
import { ComponentId } from "./types";

interface Props {
  id: ComponentId;
  statement: StatementOut;
  className?: string;
  showStatusText?: boolean;
  contextTrailItems?: ContextTrailItem[];
  showJustificationCount?: boolean;
}

export default function StatementViewer({
  id,
  statement,
  className,
  showStatusText = true,
  contextTrailItems,
  showJustificationCount = true,
  ...rest
}: Props) {
  if (!statement) {
    return <CircularProgress id={combineIds(id, "progress")} />;
  }

  const age = statement.created ? moment(statement.created).fromNow() : "";
  const created = statement.created
    ? moment(statement.created).format(config.humanDateTimeFormat)
    : "";
  const creatorName = get(statement, "creator.longName");
  const creatorNameDescription = (creatorName && ` by ${creatorName}`) || "";

  return (
    <div {...rest} id={id} className={cn(className, "statement-viewer")}>
      <div className="statement-viewer">
        <div className="statement-text">
          <Link to={paths.statement(statement.id, contextTrailItems)}>
            {describeRootTarget(
              JustificationRootTargetTypes.STATEMENT,
              statement
            )}{" "}
            {showJustificationCount &&
              statement.rootJustificationCountByPolarity && (
                <JustificationCountViewer
                  justificationCountByPolarity={
                    statement.rootJustificationCountByPolarity
                  }
                />
              )}
          </Link>
        </div>
        {showStatusText && (
          <div>
            <span className="entity-status-text">
              created{creatorNameDescription} <span title={created}>{age}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}