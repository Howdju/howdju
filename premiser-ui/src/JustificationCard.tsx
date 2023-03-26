import React from "react";
import { Card, CardText } from "react-md";
import { Props as ReactMdProps } from "react-md/lib";
import cn from "classnames";

import { ContextTrailItem, JustificationOut } from "howdju-common";

import JustificationEntityViewer from "./JustificationEntityViewer";
import { ComponentId, OnClickJustificationWritQuoteUrl } from "./types";

import "./JustificationCard.scss";

interface Props {
  id: ComponentId;
  justification: JustificationOut;
  doShowControls?: boolean;
  showStatusText?: boolean;
  className?: string;
  contextTrailItems?: ContextTrailItem[];
  showBasisUrls?: boolean;
  doShowTargets?: boolean;
  onExpandCounterAncestors?: ReactMdProps["onClick"];
  onClickWritQuoteUrl?: OnClickJustificationWritQuoteUrl;
}

export default function JustificationCard({
  id,
  justification,
  doShowControls = true,
  showStatusText = true,
  onExpandCounterAncestors,
  contextTrailItems,
  className,
  showBasisUrls = false,
  doShowTargets = true,
  onClickWritQuoteUrl,
  ...rest
}: Props) {
  return (
    <Card {...rest} className={cn(className, "entity-card")}>
      <CardText>
        <JustificationEntityViewer
          id={id}
          justification={justification}
          doShowControls={doShowControls}
          onExpandCounterAncestors={onExpandCounterAncestors}
          showBasisUrls={showBasisUrls}
          doShowRootTarget={doShowTargets}
          doShowCounterTarget={doShowTargets}
          onClickWritQuoteUrl={onClickWritQuoteUrl}
          showStatusText={showStatusText}
          contextTrailItems={contextTrailItems}
        />
      </CardText>
    </Card>
  );
}
