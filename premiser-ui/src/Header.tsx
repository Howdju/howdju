import React from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { TabsProps, Toolbar } from "react-md";

import app from "./app/appSlice";
import MainSearch from "@/components/mainSearchBox/MainSearchBox";
import IconButton from "@/components/button/IconButton";

import "./Header.scss";
import { FontIcon } from "@react-md/icon";

interface Props {
  tabs: React.ComponentClass<TabsProps>;
}

export default function Header(props: Props) {
  const dispatch = useDispatch();
  const { tabs } = props;
  const hasTabs = !!tabs;
  return (
    <Toolbar
      id="header"
      colored
      fixed
      title={
        <Link to="/">
          <span id="title">howdju?</span>
        </Link>
      }
      prominent={hasTabs}
      actions={
        <IconButton
          className="toggleNavDrawerVisibility"
          onClick={() => dispatch(app.toggleNavDrawerVisibility())}
        >
          <FontIcon>menu</FontIcon>
        </IconButton>
      }
    >
      <MainSearch />
      {tabs}
    </Toolbar>
  );
}
