import React, { Component } from "react";
import { Card, CardText } from "react-md";
import { Props as ReactMdProps } from "react-md/lib";
import cn from "classnames";

import { ContextTrailItem, JustificationView } from "howdju-common";

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
  onExpandCounterAncestors?: ReactMdProps["onClick"];
  onClickWritQuoteUrl?: OnClickJustificationWritQuoteUrl;
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
}
