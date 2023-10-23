import React, { Component, CSSProperties, MouseEventHandler } from "react";
import cn from "classnames";

import { ContextTrailItem, JustificationView } from "howdju-common";

import { Card, CardContent } from "@/components/card/Card";
import JustificationEntityViewer from "./JustificationEntityViewer";
import { ComponentId, OnClickJustificationWritQuoteUrl } from "./types";

import "./JustificationCard.scss";

interface Props {
  id: ComponentId;
  justification: JustificationView;
  doShowControls?: boolean;
  showStatusText?: boolean;
  className?: string;
  contextTrailItems?: ContextTrailItem[];
  showBasisUrls?: boolean;
  doShowTargets?: boolean;
  onExpandCounterAncestors?: MouseEventHandler;
  onClickWritQuoteUrl?: OnClickJustificationWritQuoteUrl;
  style?: CSSProperties;
}

// TODO(221) convert to functional component
export default class JustificationCard extends Component<Props> {
  render() {
    const {
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
    } = this.props;
    return (
      <Card {...rest} className={cn(className, "entity-card")}>
        <CardContent>
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
        </CardContent>
      </Card>
    );
  }
}
