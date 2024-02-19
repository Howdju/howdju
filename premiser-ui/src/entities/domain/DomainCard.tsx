import React, { Component, CSSProperties } from "react";
import cn from "classnames";

import { Domain } from "howdju-common";

import { Card, CardContent } from "@/components/card/Card";
import DomainEntityViewer from "./DomainEntityViewer";

interface Props {
  domain: Domain;
  className?: string;
  style?: CSSProperties;
}

// TODO(#221) convert to functional component
export default class DomainCard extends Component<Props> {
  render() {
    const { domain, className, ...rest } = this.props;
    return (
      <Card {...rest} className={cn(className, "entity-card")}>
        <CardContent>
          <DomainEntityViewer domain={domain} />
        </CardContent>
      </Card>
    );
  }
}
