import React from "react";
import { Grid } from "@react-md/utils";
import FlipMove from "react-flip-move";

import config from "@/config";

export interface FlipGridProps extends React.HTMLAttributes<HTMLDivElement> {}

/** Encapsulates our pattern for FLIP-capable grids. */
export function FlipGrid({ children, ...rest }: FlipGridProps) {
  return (
    <Grid {...rest} cloneStyles={true}>
      <FlipMove {...config.ui.flipMove}>{children}</FlipMove>
    </Grid>
  );
}
