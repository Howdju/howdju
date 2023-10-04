import React from "react";
import { TextIconSpacing } from "@react-md/icon";

import { IconElement } from "./types";
import { Button, ButtonProps } from "./Button";

export type SecondaryButtonProps = ButtonProps & {
  themeType?: never;
  icon?: IconElement;
  children: string;
};

/**
 * A medium-emphasis button. These contain actions that are important, but aren’t the primary action
 * in the app.
 *
 * See https://m2.material.io/components/buttons#outlined-button
 */
export default function OutlineButton({
  icon,
  children,
  theme = "primary",
  ...rest
}: SecondaryButtonProps) {
  if (icon) {
    return (
      <Button {...rest} theme={theme} themeType="outline">
        <TextIconSpacing icon={icon}>{children}</TextIconSpacing>
      </Button>
    );
  }
  return (
    <Button {...rest} theme={theme} themeType="outline">
      {children}
    </Button>
  );
}
