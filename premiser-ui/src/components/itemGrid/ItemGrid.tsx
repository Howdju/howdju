import { ComponentId } from "@/types";
import { GridCell, GridCellProps } from "@react-md/utils";
import React from "react";

import { FlipGrid } from "@/components/layout/FlipGrid";

export interface ItemGridProps {
  id: ComponentId;
  items: React.ReactElement[];
  itemColSpans: GridCellProps;
}

/**
 * A grid of items.
 *
 * Use this instead of ListEntitiesWidget when you already have the list of items
 * to show.
 */
export function ItemGrid({ id, items, itemColSpans, ...rest }: ItemGridProps) {
  return (
    <FlipGrid id={id} {...rest}>
      {items?.map((item) => {
        return (
          <GridCell key={item.key} {...itemColSpans}>
            {item}
          </GridCell>
        );
      })}
    </FlipGrid>
  );
}
