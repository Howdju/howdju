import React, { useState } from "react";

import cn from "classnames";
import { Link } from "react-router-dom";
import { Action, Location } from "history";

import { history } from "./history";
import t, {
  MAIN_TABS_ABOUT_TAB_NAME,
  MAIN_TABS_RECENT_ACTIVITY_TAB_NAME,
} from "./texts";
import paths from "./paths";
import { useEffect } from "react";
import { logger } from "./logger";

import "./NavTabs.scss";

const tabInfos = [
  {
    path: paths.home(),
    text: "Home",
    id: "landing-tab",
  },
  {
    path: paths.recentActivity(),
    text: t(MAIN_TABS_RECENT_ACTIVITY_TAB_NAME),
    id: "recent-activity-tab",
  },
  {
    path: paths.about(),
    text: t(MAIN_TABS_ABOUT_TAB_NAME),
    id: "about-tab",
  },
];

export default function NavTabs() {
  useEffect(() => syncTabToPathname(window.location.pathname));

  useEffect(
    () =>
      // history.listen returns the unlistener.
      history.listen((location: Location, _action: Action) => {
        logger.debug("onHistoryListen", location.pathname);
        syncTabToPathname(location.pathname);
      }),
    []
  );

  const [activeTabIndex, setActiveTabIndex] = useState(-1);

  function syncTabToPathname(pathname: string) {
    setActiveTabIndex(tabInfos.findIndex((ti) => ti.path === pathname));
  }

  return (
    <ul id="nav-tabs" aria-orientation="horizontal" role="tablist">
      {tabInfos.map((ti, i) => {
        const active = i === activeTabIndex;
        return (
          <li
            key={ti.id}
            className={cn("nav-tab", { active })}
            role="tab"
            aria-selected={active}
          >
            <Link to={ti.path}>{ti.text}</Link>
          </li>
        );
      })}
    </ul>
  );
}
