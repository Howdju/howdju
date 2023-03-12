import React from "react";
import map from "lodash/map";
import take from "lodash/take";
import cn from "classnames";

import {
  ContextTrailItem,
  JustificationOut,
  PropositionOut,
  StatementOut,
} from "howdju-common";

import PropositionCard from "./PropositionCard";
import StatementCard from "./StatementCard";
import JustificationCard from "./JustificationCard";
import TreePolarity from "./components/TreePolarity";
import { ComponentId } from "./types";

import "./ContextTrail.scss";

export default function ContextTrail({
  id,
  trailItems,
  className,
}: {
  id: ComponentId;
  trailItems: ContextTrailItem[];
  className?: string;
}) {
  function toCard(trailItem: ContextTrailItem, trailItems: ContextTrailItem[]) {
    switch (trailItem.connectingEntityType) {
      case "JUSTIFICATION": {
        const justificationTarget = trailItem.connectingEntity.target;
        switch (justificationTarget.type) {
          case "PROPOSITION":
            return propositionToCard(justificationTarget.entity, trailItems);
          case "STATEMENT":
            return statementToCard(justificationTarget.entity, trailItems);
          case "JUSTIFICATION":
            return justificationToCard(justificationTarget.entity, trailItems);
        }
      }
    }
  }

  function propositionToCard(
    proposition: PropositionOut,
    trailItems: ContextTrailItem[]
  ) {
    const cardId = `${id}-proposition-${proposition.id}`;
    return (
      <PropositionCard
        id={cardId}
        proposition={proposition}
        contextTrailItems={trailItems}
        showStatusText={false}
      />
    );
  }

  function statementToCard(
    statement: StatementOut,
    trailItems: ContextTrailItem[]
  ) {
    const cardId = `${id}-statement-${statement.id}`;
    return (
      <StatementCard
        id={cardId}
        statement={statement}
        contextTrailItems={trailItems}
        showStatusText={false}
      />
    );
  }

  function justificationToCard(
    justification: JustificationOut,
    trailItems: ContextTrailItem[]
  ) {
    const cardId = `${id}-justification-${justification.id}`;
    return (
      <JustificationCard
        id={cardId}
        justification={justification}
        doShowBasisJustifications={false}
        doShowControls={false}
        doShowTargets={false}
        contextTrailItems={trailItems}
        showStatusText={false}
      />
    );
  }

  return trailItems.length > 0 ? (
    <ul className={cn(className, "context-trail")}>
      {map(trailItems, (trailItem, index) => (
        <li key={index}>
          <TreePolarity polarity={trailItem.polarity}>
            {toCard(trailItem, take(trailItems, index))}
          </TreePolarity>
        </li>
      ))}
    </ul>
  ) : (
    <div />
  );
}
