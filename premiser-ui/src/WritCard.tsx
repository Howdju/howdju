import React, { Component } from "react";
import { Card, CardText } from "react-md";
import cn from "classnames";

import { EmptyObject, WritOut } from "howdju-common";

import WritEntityViewer from "./WritEntityViewer";
import { ComponentId } from "./types";

interface WritCardProps {
  id: ComponentId;
  writ: WritOut;
  className?: string;
}

// TODO(221) convert to functional component
export default class WritCard extends Component<WritCardProps, EmptyObject> {
  render() {
    const { id, writ, className, ...rest } = this.props;
    return (
      <Card {...rest} className={cn(className, "entity-card")}>
        <CardText>
          <WritEntityViewer id={id} writ={writ} />
        </CardText>
      </Card>
    );
  }
}
