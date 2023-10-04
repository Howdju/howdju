import React from "react";
import { TextIconSpacing } from "@react-md/icon";

import { Button, ButtonProps } from "./Button";
import { IconElement } from "./types";

export type TextButtonProps = ButtonProps & {
  themeType?: never;
  icon?: IconElement;
  children: string;
};

/**
 * A button rendered similar to regular text with an optional icon.
 *
 * Text buttons are typically used for less-pronounced actions, including those located:
 *
 *  - In dialogs
 *  - In cards
 *
 * In cards, text buttons help maintain an emphasis on card content.
 *
 * See https://m2.material.io/components/buttons#text-button
 */
export default function TextButton({
  icon,
  children,
  theme = "primary",
  ...rest
}: TextButtonProps) {
  if (icon) {
    return (
      <Button {...rest} theme={theme} themeType="flat">
        <TextIconSpacing icon={icon}>{children}</TextIconSpacing>
      </Button>
    );
  }
  return (
    <Button {...rest} theme={theme} themeType="flat">
      {children}
    </Button>
  );
}
