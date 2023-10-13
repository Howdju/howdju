import React, { ReactElement } from "react";
import cn from "classnames";

import { ChipProps } from "./Chip";

import "./ChipsList.scss";
import { ComponentId } from "@/types";

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
      {/* TODO need to propagate index to callbacks? Need to get id for key? */}
      {chips}
      {extraChildren}
    </div>
  );
}
