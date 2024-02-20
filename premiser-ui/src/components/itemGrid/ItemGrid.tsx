import { ComponentId } from "@/types";
import { Grid, GridCell, GridCellProps } from "@react-md/utils";
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
  if (items.length > 64) {
    // If there are a lot of items, the list takes a long time to render. Also
    // there are weird behaviors when updating the list, like floating items
    // above the list's normal position. So we use a regular grid for large
    // lists.
    //
    // TODO(#221) see if there are more performant FLIP libraries
    return (
      <Grid id={id} {...rest}>
        {items?.map((item) => {
          return (
            <GridCell key={item.key} {...itemColSpans}>
              {item}
            </GridCell>
          );
        })}
      </Grid>
    );
  }
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
