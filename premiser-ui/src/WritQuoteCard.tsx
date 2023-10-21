import React, { Component } from "react";
import { FontIcon } from "@react-md/icon";
import cn from "classnames";

import { newUnimplementedError, WritQuoteOut } from "howdju-common";

import { DropdownMenu, MenuItem } from "@/components/menu/Menu";
import { Card, CardContent } from "@/components/card/Card";
import WritQuoteEntityViewer from "./WritQuoteEntityViewer";
import { combineIds } from "./viewModels";
import { ComponentId } from "./types";

import "./WritQuoteCard.scss";

interface WritQuoteCardProps {
  id: ComponentId;
  writQuote: WritQuoteOut;
  className?: string;
  showUrls?: boolean;
  doHideControls?: boolean;
}
// TODO(221) convert to functional component
export default class WritQuoteCard extends Component<WritQuoteCardProps> {
  render() {
    const {
      id,
      writQuote,
      className,
      showUrls = false,
      doHideControls = false,
      ...rest
    } = this.props;

    const menuItems = [
      <MenuItem
        primaryText="Create appearance"
        key="createAppearance"
        leftAddon={<FontIcon>add</FontIcon>}
        onClick={() => {
          throw newUnimplementedError(
            "Creating an appearance based on a WritQuote is not yet supported."
          );
        }}
      />,
      <MenuItem
        primaryText="Create justification"
        key="createJustification"
        leftAddon={<FontIcon>add</FontIcon>}
        onClick={() => {
          throw newUnimplementedError(
            "Creating an appearance based on a WritQuote is not yet supported."
          );
        }}
      />,
    ];

    const menu = (
      <DropdownMenu
        buttonType="icon"
        id={combineIds(id, "menu")}
        className={cn({ hidden: doHideControls })}
        menuClassName="context-menu"
        children={<FontIcon>more_vert</FontIcon>}
        items={menuItems}
      />
    );
    return (
      <Card className={cn(className, "entity-card")}>
        <CardContent>
          <WritQuoteEntityViewer
            {...rest}
            id={id}
            writQuote={writQuote}
            showUrls={showUrls}
            menu={menu}
            showStatusText={true}
          />
        </CardContent>
      </Card>
    );
  }
}
