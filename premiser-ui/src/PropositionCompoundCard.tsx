import React from "react";
import { Card, CardText } from "react-md";
import cn from "classnames";

import {
  ContextTrailItem,
  PropositionCompoundOut,
  PropositionOut,
} from "howdju-common";

import { ComponentId } from "./types";
import PropositionCompoundEntityViewer from "./PropositionCompoundEntityViewer";

interface Props {
  id: ComponentId;
  propositionCompound: PropositionCompoundOut;
  highlightedProposition?: PropositionOut;
  contextTrailItems?: ContextTrailItem[];
  showStatusText?: boolean;
  className?: string;
}

export default function PropositionCompoundCard({
  id,
  propositionCompound,
  highlightedProposition,
  showStatusText,
  className,
  contextTrailItems,
  ...rest
}: Props) {
  return (
    <Card {...rest} className={cn(className, "entity-card")}>
      <CardText>
        <PropositionCompoundEntityViewer
          id={id}
          propositionCompound={propositionCompound}
          highlightedProposition={highlightedProposition}
          contextTrailItems={contextTrailItems}
          showStatusText={showStatusText}
        />
      </CardText>
    </Card>
  );
}
