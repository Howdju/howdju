import React, { PropsWithChildren } from "react";
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import type { PreloadedState } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";
import { createMemoryHistory, History, createLocation } from "history";
import { persistStore, PersistorOptions } from "redux-persist";
import { compile } from "path-to-regexp";
import { match } from "react-router";

import type { AppStore, RootState } from "./setupStore";
import { setupStore } from "./setupStore";
import { head } from "lodash";

interface ExtendedRenderOptions extends Omit<RenderOptions, "queries"> {
  preloadedState?: PreloadedState<RootState>;
  store?: AppStore;
  persist?: boolean;
  history?: History<any>;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    history = createMemoryHistory(),
    store = setupStore(history, preloadedState),
    persist = true,
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const persistor = persistStore(store, {
    manualPersist: true,
  } as PersistorOptions);
  if (persist) {
    persistor.persist();
  }
  function Wrapper({
    children,
  }: PropsWithChildren<Record<string, unknown>>): JSX.Element {
    return (
      <Provider store={store}>
        <Router history={history}>{children}</Router>
      </Provider>
    );
  }

  return {
    store,
    persistor,
    history,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

export interface MakeRouteComponentPropsOptions<T> {
  pathParams?: T;
  searchParams?: Record<string, string>;
}

/**
 * Makes RouteComponentProps.
 *
 * @param path The parameterized react-router path: `/p/:id`.
 * @param params the parameters to substitute in the path: `{id: "123"}`.
 */
export function makeRouteComponentProps<T extends Record<string, string>>(
  path: string,
  { pathParams = {} as T, searchParams }: MakeRouteComponentPropsOptions<T>
) {
  const toUrl = compile(path, { encode: encodeURIComponent });
  const url = toUrl(pathParams);
  const match: match<T> = {
    isExact: false,
    path,
    url,
    params: pathParams,
  };
  const locationPath = searchParams
    ? match.url + "?" + new URLSearchParams(searchParams)
    : match.url;
  const location = createLocation(locationPath);

  return { match, location };
}

/**
 * Filters the elements to only those that are visible.
 *
 * react-md uses a hidden and visible input element as an implementation detail. In our tests we
 * often only want to assert on the visible one.
 */
export function ariaVisibleOne(
  elements: HTMLElement[]
): HTMLElement | undefined {
  return head(
    elements.filter((e) => e.getAttribute("aria-hidden") !== "false")
  );
}
