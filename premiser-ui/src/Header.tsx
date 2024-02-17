import React from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FontIcon } from "@react-md/icon";
import { AppBar, AppBarTitle, AppBarAction } from "@react-md/app-bar";

import app from "./app/appSlice";
import MainSearch from "@/components/mainSearchBox/MainSearchBox";

import "./Header.scss";

export default function Header() {
  const dispatch = useDispatch();
  return (
    <AppBar id="header">
      <AppBarTitle id="title">
        <Link to="/">howdju?</Link>
      </AppBarTitle>
      <AppBarTitle id="main-search-container">
        <MainSearch />
      </AppBarTitle>
      <AppBarAction
        first
        last
        onClick={() => dispatch(app.toggleNavDrawerVisibility())}
      >
        <FontIcon>menu</FontIcon>
      </AppBarAction>
    </AppBar>
  );
}
