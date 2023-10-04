import React from "react";
import { TextIconSpacing } from "@react-md/icon";

import { Button, ButtonProps } from "./Button";
import { IconElement } from "./types";

export type PrimaryButtonProps = ButtonProps & {
  themeType?: never;
  icon?: IconElement;
  children: string;
};

/**
 * A high-emphasis button, distinguished by their use of elevation and fill. They
 * contain actions that are primary to the app.
 *
 * See https://m2.material.io/components/buttons#contained-button
 */
export default function SolidButton({
  icon,
  children,
  theme = "primary",
  ...rest
}: PrimaryButtonProps) {
  if (icon) {
    return (
      <Button {...rest} theme={theme} themeType="contained">
        <TextIconSpacing icon={icon}>{children}</TextIconSpacing>
      </Button>
    );
  }
  return (
    <Button {...rest} theme={theme} themeType="contained">
      {children}
    </Button>
  );
}
