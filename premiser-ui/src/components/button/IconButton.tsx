import React from "react";

import { Button, ButtonProps } from "./Button";
import { IconElement } from "./types";

export type IconButtonProps = ButtonProps & {
  children: IconElement;
};

/** A button displaying just an icon. */
export default function IconButton({
  theme = "primary",
  children,
  ...rest
}: IconButtonProps) {
  return (
    <Button {...rest} buttonType="icon" theme={theme}>
      {children}
    </Button>
  );
}
