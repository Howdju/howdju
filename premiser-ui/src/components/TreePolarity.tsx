import React, { ReactNode } from "react";
import cn from "classnames";
import { JustificationPolarities, RelationPolarity } from "howdju-common";

import "./TreePolarity.scss";

interface Props {
  polarity: RelationPolarity | undefined;
  children: ReactNode;
}
// Offsets and colors justifications in a tree according to their polarity.
export default function TreePolarity({ polarity, children }: Props) {
  const isPositive = polarity === JustificationPolarities.POSITIVE;
  const isNegative = polarity === JustificationPolarities.NEGATIVE;
  return (
    <div
      className={cn({
        "tree-polarity--positive": isPositive,
        "tree-polarity--negative": isNegative,
      })}
    >
      {children}
    </div>
  );
}
