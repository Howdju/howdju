import React, { Component, CSSProperties } from "react";
import cn from "classnames";

import { ContextTrailItem, PropositionOut } from "howdju-common";

import { Card, CardContent } from "@/components/card/Card";
import PropositionEntityViewer from "./PropositionEntityViewer";
import { ComponentId } from "./types";

interface Props {
  id: ComponentId;
  proposition: PropositionOut;
  showStatusText?: boolean;
  className?: string;
  contextTrailItems?: ContextTrailItem[];
  style?: CSSProperties;
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
        <CardContent>
          <PropositionEntityViewer
            id={id}
            proposition={proposition}
            contextTrailItems={contextTrailItems}
            showStatusText={showStatusText}
          />
        </CardContent>
      </Card>
    );
  }
}
