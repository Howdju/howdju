import React from "react";

// react-md also has a MenuItemSeparator which seems pretty much identical to using
// a divider except that it has a maxHeight prop.
import { Divider, DividerProps as MenuDividerProps } from "@react-md/divider";

export type { DividerProps as MenuDividerProps } from "@react-md/divider";

export function MenuDivider({ inset = true, ...rest }: MenuDividerProps) {
  return <Divider inset={inset} {...rest} />;
}
