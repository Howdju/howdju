import React from "react";

export { DropdownMenu, MenuItemLink } from "@react-md/menu";
export { ListItem as MenuItem } from "@react-md/list";

import {
  MenuItemSeparator as ReactMdMenuItemSeparator,
  MenuItemSeparatorProps,
} from "@react-md/menu";

export type { MenuItemSeparatorProps } from "@react-md/menu";

/** A MenuItemSeparator that defaults to inset. */
export function MenuItemSeparator({
  inset = true,
  ...rest
}: MenuItemSeparatorProps) {
  return <ReactMdMenuItemSeparator inset={inset} {...rest} />;
}
