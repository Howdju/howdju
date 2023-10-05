import React, { Component } from "react";
import cn from "classnames";

import { EmptyObject, WritOut } from "howdju-common";

import { Card, CardContent } from "@/components/card/Card";
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
        <CardContent>
          <WritEntityViewer id={id} writ={writ} />
        </CardContent>
      </Card>
    );
  }
}
