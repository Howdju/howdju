import React from "react";
import map from "lodash/map";
import take from "lodash/take";
import cn from "classnames";

import {
  JustificationOut,
  JustificationTargetTypes,
  newExhaustedEnumError,
  PropositionOut,
  StatementOut,
} from "howdju-common";

import * as characters from "./characters";
import PropositionCard from "./PropositionCard";
import StatementCard from "./StatementCard";
import JustificationCard from "./JustificationCard";
import TreePolarity from "./components/TreePolarity";
import { ComponentId, ContextTrailItem } from "./types";

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
    switch (trailItem.targetType) {
      case JustificationTargetTypes.PROPOSITION:
        return propositionToCard(trailItem.target, trailItems);
      case JustificationTargetTypes.STATEMENT:
        return statementToCard(trailItem.target, trailItems);
      case JustificationTargetTypes.JUSTIFICATION:
        return justificationToCard(trailItem.target, trailItems);
      default:
        throw newExhaustedEnumError(trailItem);
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

  function polarity(trailItem: ContextTrailItem) {
    switch (trailItem.targetType) {
      case "JUSTIFICATION":
        return trailItem.target.polarity;
      default:
        return undefined;
    }
  }

  return trailItems.length > 0 ? (
    <ul className={cn(className, "context-trail")}>
      {map(trailItems, (trailItem, index) => (
        <li key={index}>
          <TreePolarity polarity={polarity(trailItem)}>
            {trailItem && trailItem.target
              ? toCard(trailItem, take(trailItems, index))
              : characters.ellipsis}
          </TreePolarity>
        </li>
      ))}
    </ul>
  ) : (
    <div />
  );
}
