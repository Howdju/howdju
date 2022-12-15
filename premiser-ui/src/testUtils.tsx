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
    store = setupStore(preloadedState),
    persist = true,
    history = createMemoryHistory(),
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

/**
 * Makes RouteComponentProps.
 *
 * @param path The parameterized react-router path: `/p/:id`.
 * @param params the parameters to substitute in the path: `{id: "123"}`.
 */
export function makeRouteComponentProps<T extends Record<string, string>>(
  path: string,
  params: T
) {
  const toUrl = compile(path, { encode: encodeURIComponent });
  const url = toUrl(params);
  const match: match<T> = {
    isExact: false,
    path,
    url,
    params,
  };
  const location = createLocation(match.url);

  return { match, location };
}
