import React from "react";
import map from "lodash/map";
import take from "lodash/take";
import cn from "classnames";

import {
  PropositionOut,
  StatementOut,
  ContextTrailItem,
  JustificationView,
  AppearanceView,
} from "howdju-common";

import PropositionCard from "@/PropositionCard";
import StatementCard from "@/StatementCard";
import JustificationCard from "@/JustificationCard";
import TreePolarity from "@/components/TreePolarity";
import { ComponentId } from "@/types";
import PropositionCompoundCard from "@/PropositionCompoundCard";
import AppearanceCard from "@/pages/appearances/AppearanceCard";
import { combineIds } from "@/viewModels";

export default function ContextTrail({
  id,
  trailItems,
  className,
}: {
  id: ComponentId;
  trailItems: ContextTrailItem[];
  className?: string;
}) {
  return trailItems.length > 0 ? (
    <ul className={cn(className, "context-trail")}>
      {map(trailItems, (trailItem, i) => {
        const polarity = i > 0 ? trailItems[i - 1].polarity : undefined;
        return (
          <li key={i}>
            <TreePolarity polarity={polarity}>
              {toCard(id, trailItem, take(trailItems, i))}
            </TreePolarity>
          </li>
        );
      })}
    </ul>
  ) : (
    <div />
  );
}

function toCard(
  id: ComponentId,
  trailItem: ContextTrailItem,
  prevTrailItems: ContextTrailItem[]
) {
  switch (trailItem.connectingEntityType) {
    case "JUSTIFICATION":
      {
        const justificationTarget = trailItem.connectingEntity.target;
        switch (justificationTarget.type) {
          case "PROPOSITION":
            return propositionToCard(
              id,
              justificationTarget.entity,
              prevTrailItems
            );
          case "STATEMENT":
            return statementToCard(
              id,
              justificationTarget.entity,
              prevTrailItems
            );
          case "JUSTIFICATION":
            return justificationToCard(
              id,
              justificationTarget.entity,
              prevTrailItems
            );
        }
      }
      break;
    case "APPEARANCE": {
      return appearanceToCard(id, trailItem.connectingEntity, prevTrailItems);
    }
  }
}

function propositionToCard(
  id: ComponentId,
  proposition: PropositionOut,
  trailItems: ContextTrailItem[]
) {
  const cardId = `${id}-proposition-${proposition.id}`;
  const prevTrailItem = trailItems[trailItems.length - 1];
  if (
    prevTrailItem &&
    prevTrailItem.connectingEntityType === "JUSTIFICATION" &&
    prevTrailItem.connectingEntity.basis.type === "PROPOSITION_COMPOUND" &&
    prevTrailItem.connectingEntity.basis.entity.atoms.length > 1
  ) {
    return (
      <PropositionCompoundCard
        id={cardId}
        style={{ width: "100%" }}
        propositionCompound={prevTrailItem.connectingEntity.basis.entity}
        highlightedProposition={proposition}
        contextTrailItems={trailItems}
        showStatusText={false}
      />
    );
  }
  return (
    <PropositionCard
      id={cardId}
      style={{ width: "100%" }}
      proposition={proposition}
      contextTrailItems={trailItems}
      showStatusText={false}
    />
  );
}

function statementToCard(
  id: ComponentId,
  statement: StatementOut,
  trailItems: ContextTrailItem[]
) {
  const cardId = `${id}-statement-${statement.id}`;
  return (
    <StatementCard
      id={cardId}
      style={{ width: "100%" }}
      statement={statement}
      contextTrailItems={trailItems}
      showStatusText={false}
    />
  );
}

function appearanceToCard(
  id: ComponentId,
  appearance: AppearanceView,
  trailItems: ContextTrailItem[]
) {
  return (
    <>
      {/* TODO(684) split into MediaExcerptCard and AppearanceInfoCard ("has an appearance of") */}
      <AppearanceCard
        id={combineIds(id, "appearance", appearance.id)}
        style={{ width: "100%" }}
        appearance={appearance}
        contextTrailItems={trailItems}
        mode="CONTEXT_TRAIL"
      />
      <p>Presents:</p>
    </>
  );
}

function justificationToCard(
  id: ComponentId,
  justification: JustificationView,
  trailItems: ContextTrailItem[]
) {
  const cardId = `${id}-justification-${justification.id}`;
  return (
    <JustificationCard
      id={cardId}
      style={{ width: "100%" }}
      justification={justification}
      doShowControls={false}
      doShowTargets={false}
      contextTrailItems={trailItems}
      showStatusText={false}
    />
  );
}
