import React from "react";
import { Link } from "react-router-dom";
import cn from "classnames";
import moment from "moment";
import { get } from "lodash";

import { ContextTrailItem, EntityId, PropositionOut } from "howdju-common";

import paths from "./paths";
import config from "./config";
import JustificationCountViewer from "./JustificationCountViewer";
import { useAppDispatch } from "./hooks";
import propositionAppearancesDialog from "@/components/propositionAppearancesDialog/propositionAppearancesDialogSlice";
import { MaterialSymbol } from "react-material-symbols";

interface Props {
  id: EntityId;
  proposition: PropositionOut;
  className?: string;
  showStatusText?: boolean;
  contextTrailItems?: ContextTrailItem[];
  showJustificationCount?: boolean;
  showAppearanceCount?: boolean;
}

export default function PropositionViewer({
  id,
  proposition,
  className,
  showStatusText = true,
  contextTrailItems,
  showJustificationCount = true,
  showAppearanceCount = true,
  ...rest
}: Props) {
  const dispatch = useAppDispatch();

  const age = proposition.created ? moment(proposition.created).fromNow() : "";
  const created = proposition.created
    ? moment(proposition.created).format(config.humanDateTimeFormat)
    : "";
  const creatorName = get(proposition, "creator.longName");
  const creatorNameDescription = (creatorName && ` by ${creatorName}`) || "";

  function showPropositionAppearanceDialog() {
    dispatch(propositionAppearancesDialog.showDialog(proposition.id));
  }

  const appearanceCount = proposition.appearanceCount ?? 0;
  const rootJustificationCountByPolarity =
    proposition.rootJustificationCountByPolarity ?? {
      POSITIVE: 0,
      NEGATIVE: 0,
    };
  const showRelationCounts = showJustificationCount || showAppearanceCount;
  return (
    <div {...rest} id={id} className={cn(className, "proposition-viewer")}>
      {proposition && (
        <div className="proposition-viewer">
          <div className="proposition-text">
            <Link to={paths.proposition(proposition, contextTrailItems)}>
              {proposition.text}
            </Link>
          </div>
          {showRelationCounts && (
            <div className="relation-counts">
              {showJustificationCount && (
                <Link to={paths.proposition(proposition, contextTrailItems)}>
                  <JustificationCountViewer
                    justificationCountByPolarity={
                      rootJustificationCountByPolarity
                    }
                  />
                </Link>
              )}{" "}
              {showAppearanceCount && (
                <span className="entity-status-text">
                  <a
                    className="clickable"
                    onClick={showPropositionAppearanceDialog}
                    title={`${appearanceCount} ${
                      appearanceCount === 1 ? "appearance" : "appearances"
                    }`}
                  >
                    <MaterialSymbol icon="pin_drop" size={12} />
                    {appearanceCount}
                  </a>
                </span>
              )}
            </div>
          )}
          {showStatusText && (
            <div>
              <span className="entity-status-text">
                created{creatorNameDescription}{" "}
                <span title={created}>{age}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
