import React, { ReactElement } from "react";
import cn from "classnames";
import FlipMove from "react-flip-move";

import { ChipProps } from "./Chip";
import { ComponentId } from "@/types";
import config from "@/config";

import "./ChipsList.scss";

export interface ChipsListProps {
  id: ComponentId;
  chips: ReactElement<ChipProps & { key: string }>[];
  /** Optional extra children that will be inserted at the end of the list as flex siblings of the chips. */
  extraChildren: JSX.Element[];
  /** Optional extra classes to apply to the wrapper of the chips. */
  className?: string;
}

/** Displays a list of chips in a flex box */
export function ChipsList(props: ChipsListProps) {
  const { chips, extraChildren, className, ...rest } = props;

  return (
    <div {...rest} className={cn(className, "chips-list")}>
      <FlipMove {...config.ui.flipMove}>{chips}</FlipMove>
      {extraChildren}
    </div>
  );
}
