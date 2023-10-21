import React from "react";
import FlipMove from "react-flip-move";

import config from "./config";
import { ComponentId } from "./types";

interface Props extends FlipMove.FlipMoveProps {
  id?: ComponentId;
  children: React.ReactNode;
}

/** Displays childen in a FlipMove */
export default function CellList(props: Props) {
  const { children, ...rest } = props;
  const flipMoveProps = config.ui.flipMove;

  return (
    <FlipMove {...flipMoveProps} {...rest}>
      {children}
    </FlipMove>
  );
}
