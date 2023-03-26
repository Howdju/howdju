import React, { Component } from "react";
import PropTypes from "prop-types";
import { Card, CardText, FontIcon, ListItem, MenuButton } from "react-md";
import cn from "classnames";

import WritQuoteEntityViewer from "./WritQuoteEntityViewer";

import "./WritQuoteCard.scss";
import { combineIds } from "./viewModels";
import { newUnimplementedError } from "howdju-common";

export default class WritQuoteCard extends Component {
  render() {
    const { id, writQuote, className, showUrls, doHideControls, ...rest } =
      this.props;

    const menuItems = [
      <ListItem
        primaryText="Create appearance"
        key="createAppearance"
        leftIcon={<FontIcon>add</FontIcon>}
        onClick={() => {
          throw newUnimplementedError();
        }}
      />,
      <ListItem
        primaryText="Create justification"
        key="createJustification"
        leftIcon={<FontIcon>add</FontIcon>}
        onClick={() => {
          throw newUnimplementedError();
        }}
      />,
    ];
    const menuButton = (
      <MenuButton
        icon
        id={combineIds(id, "menu")}
        className={cn({ hidden: doHideControls })}
        menuClassName="context-menu"
        children={"more_vert"}
        position={MenuButton.Positions.TOP_RIGHT}
        menuItems={menuItems}
      />
    );

    return (
      <Card className={cn(className, "entity-card")}>
        <CardText>
          <WritQuoteEntityViewer
            {...rest}
            id={id}
            writQuote={writQuote}
            showUrls={showUrls}
            menu={menuButton}
          />
        </CardText>
      </Card>
    );
  }
}
WritQuoteCard.propTypes = {
  writQuote: PropTypes.object.isRequired,
};
WritQuoteCard.defaultProps = {
  showUrls: false,
};
