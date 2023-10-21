import React, { ReactNode } from "react";
import { Grid } from "@react-md/utils";

/**
 * A component that automatically wraps its children in single column GridCells.
 *
 * This component is a convenient way to have full-width top-level children on a page.
 */
export default function SingleColumnGrid({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Grid clone={true} columns={1}>
      {children}
    </Grid>
  );
}
