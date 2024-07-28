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
  const createdAsInfo = makeCreatedAsInfo(proposition);
  const createdAsText = createdAsInfo ? (
    <span>
      {" "}
      as{" "}
      {createdAsInfo.href ? (
        <Link to={createdAsInfo.href}>{createdAsInfo.description}</Link>
      ) : (
        createdAsInfo.description
      )}
    </span>
  ) : null;

  function showPropositionAppearanceDialog() {
    dispatch(propositionAppearancesDialog.showDialog(proposition.id));
  }

  const appearanceCount = proposition.appearanceCount ?? 0;
  const justificationBasisUsageCount =
    proposition.justificationBasisUsageCount ?? 0;
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
              <Link
                to={paths.propositionUsages(proposition.id)}
                title={`used in ${justificationBasisUsageCount} ${
                  justificationBasisUsageCount === 1
                    ? "justification"
                    : "justifications"
                }`}
              >
                <MaterialSymbol icon="merge_type" size={12} />
                {justificationBasisUsageCount}
              </Link>{" "}
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
                created{creatorNameDescription}
                {createdAsText} <span title={created}>{age}</span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function makeCreatedAsInfo(proposition: PropositionOut) {
  if (!proposition.createdAs) {
    return undefined;
  }
  const typeId = proposition.createdAs.id;
  switch (proposition.createdAs.type) {
    case "QUESTION":
      return {
        description: "a question",
        href: undefined,
      };
    case "STATEMENT":
      return {
        descripion: "a statement",
        href: typeId ? paths.statement(typeId) : undefined,
      };
    case "APPEARANCE":
      return {
        description: "an appearance",
        href: typeId ? paths.appearance(typeId) : undefined,
      };
  }
}
