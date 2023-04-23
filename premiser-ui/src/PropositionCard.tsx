import React, { Component } from "react";
import { Card, CardText } from "react-md";
import cn from "classnames";

import { ContextTrailItem, PropositionOut } from "howdju-common";

import PropositionEntityViewer from "./PropositionEntityViewer";
import { ComponentId } from "./types";

interface Props {
  id: ComponentId;
  proposition: PropositionOut;
  showStatusText?: boolean;
  className?: string;
  contextTrailItems?: ContextTrailItem[];
}

// TODO(221) convert to functional component
export default class PropositionCard extends Component<Props> {
  render() {
    const {
      id,
      proposition,
      showStatusText,
      className,
      contextTrailItems,
      ...rest
    } = this.props;
    return (
      <Card {...rest} className={cn(className, "entity-card")}>
        <CardText>
          <PropositionEntityViewer
            id={id}
            proposition={proposition}
            contextTrailItems={contextTrailItems}
            showStatusText={showStatusText}
          />
        </CardText>
      </Card>
    );
  }
}
