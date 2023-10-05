import React, { Component } from "react";
import { DropdownMenu, FontIcon, ListItem, MenuButton } from "react-md";
import cn from "classnames";

import { newUnimplementedError, WritQuoteOut } from "howdju-common";

import { Card, CardContent } from "@/components/card/Card";
import WritQuoteEntityViewer from "./WritQuoteEntityViewer";
import { combineIds } from "./viewModels";
import { ComponentId } from "./types";

import "./WritQuoteCard.scss";

interface WritQuoteCardProps {
  id: ComponentId;
  writQuote: WritQuoteOut;
  className: string;
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
      <ListItem
        primaryText="Create appearance"
        key="createAppearance"
        leftIcon={<FontIcon>add</FontIcon>}
        onClick={() => {
          throw newUnimplementedError(
            "Creating an appearance based on a WritQuote is not yet supported."
          );
        }}
      />,
      <ListItem
        primaryText="Create justification"
        key="createJustification"
        leftIcon={<FontIcon>add</FontIcon>}
        onClick={() => {
          throw newUnimplementedError(
            "Creating an appearance based on a WritQuote is not yet supported."
          );
        }}
      />,
    ];
    // TODO(17): pass props directly after upgrading react-md to a version with correct types
    const menuClassNameProps = {
      menuClassName: "context-menu",
    } as any;
    const menuButton = (
      <MenuButton
        icon
        id={combineIds(id, "menu")}
        className={cn({ hidden: doHideControls })}
        {...menuClassNameProps}
        children={"more_vert"}
        position={DropdownMenu.Positions.TOP_RIGHT}
        menuItems={menuItems}
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
            menu={menuButton}
            showStatusText={true}
          />
        </CardContent>
      </Card>
    );
  }
}
