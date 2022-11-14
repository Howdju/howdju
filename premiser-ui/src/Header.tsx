import React from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Button, TabsProps, Toolbar } from "react-md";

import app from "./app/appSlice";
import "./Header.scss";
import MainSearch from "./components/mainSearchBox/MainSearchBox";

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
        <Button
          icon
          className="toggleNavDrawerVisibility"
          onClick={() => dispatch(app.toggleNavDrawerVisibility())}
        >
          menu
        </Button>
      }
    >
      <MainSearch />
      {tabs}
    </Toolbar>
  );
}
