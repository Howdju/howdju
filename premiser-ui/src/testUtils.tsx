import React, { PropsWithChildren } from "react";
import { render, screen, RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { PreloadedState } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { Router } from "react-router-dom";
import { createMemoryHistory, History, createLocation } from "history";
import { persistStore, PersistorOptions } from "redux-persist";
import { compile } from "path-to-regexp";
import { match } from "react-router";
import { setupServer } from "msw/node";
import { Saga } from "redux-saga";
import { head } from "lodash";

import { AppStore, RootState, sagaMiddleware, setupStore } from "./setupStore";

interface ProviderRenderOptions
  extends DefaultStoreOptions,
    Omit<RenderOptions, "queries"> {
  persist?: boolean;
}

export interface DefaultStoreOptions {
  preloadedState?: PreloadedState<RootState>;
  store?: AppStore;
  history?: History<any>;
}

export function setupDefaultStore({
  preloadedState = {},
  history = createMemoryHistory(),
  store = setupStore(history, preloadedState),
}: DefaultStoreOptions = {}) {
  return { preloadedState, history, store };
}

/**
 * Use Jest fake timers.
 *
 * Restores real timers after each to allow third-party libraries to cleanup. See
 * https://testing-library.com/docs/using-fake-timers/
 *
 * TODO(219): should we do this in a Jest environment instead?
 */
export function withFakeTimers(config?: FakeTimersConfig) {
  beforeEach(() => {
    // Use fake timers so that we can ensure animations complete before snapshotting.
    jest.useFakeTimers(config);
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
}

/** Configures an msw fake server for the test.
 *
 * @returns the mock server
 */
export function withMockServer() {
  const server = setupServer();

  beforeAll(() => {
    server.listen();
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });
  return server;
}

/** Render a React component with the redux store etc. */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    history = createMemoryHistory(),
    store = setupStore(history, preloadedState),
    persist = true,
    ...renderOptions
  }: ProviderRenderOptions = {}
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
  options?: MakeRouteComponentPropsOptions<T>
) {
  const { pathParams = {} as T, searchParams = {} } = options ?? {};
  const toUrl = compile(path, { encode: encodeURIComponent });
  const url = toUrl(pathParams);
  const match: match<T> = {
    isExact: false,
    path,
    url,
    params: pathParams,
  };
  const locationPath = searchParams
    ? match.url + "?" + new URLSearchParams(searchParams).toString()
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

/** Run a saga with the redux store etc. in place. */
export async function testSaga(saga: Saga<any[]>) {
  const history = createMemoryHistory();
  const preloadedState = {};
  const store = setupStore(history, preloadedState);
  const persistor = persistStore(store, {
    manualPersist: true,
  } as PersistorOptions);
  persistor.persist();
  await sagaMiddleware.run(saga).toPromise();
}

export type UserEvent = ReturnType<typeof userEvent.setup>;
export function setupUserEvent() {
  // userEvent delays between actions, so make sure it advances the fake timers.
  // (https://github.com/testing-library/user-event/issues/833#issuecomment-1171452841)
  return userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
}

/**
 * Helper to ensure a button is enabled an click it.
 *
 * We have a pattern of leaving buttons enabled DOM-wise, but rendering them as disabled
 * and preventing their onClick if the form is not valid. This pattern allows us to show all form
 * errors upon button click. Otherwise, a DOM-disabled button doesn't even fire an onClick.
 *
 * But a downside of that pattern is that our tests can silently fail when they click a button that
 * is disabled due to some earlier problem with the test.
 */
export function clickEnabledButton(user: UserEvent, name: string | RegExp) {
  const button = screen.getByRole("button", { name });
  expect(button).not.toHaveClass("md-text--disabled");
  return user.click(button);
}

/** Throws if progress is in the document and visible. */
export function progressToBeGone(progress: HTMLElement | null) {
  try {
    expect(progress).not.toBeInTheDocument();
  } catch {
    // Sometimes CircularProgress hangs around in the DOM even though it is invisible.
    // TODO(17): Check if this is still necessary after upgrading react-md
    // eslint-disable-next-line jest/no-conditional-expect
    expect(progress).toHaveStyle({ opacity: 0 });
  }
}

export function getTextContent(element: Element | null) {
  if (!element) {
    throw new Error("Element is null");
  }
  const textContent = element.textContent;
  if (textContent === null) {
    throw new Error("textContent is null");
  }
  return textContent;
}

export function getElementByQuerySelector(selector: string) {
  const element = document.querySelector(selector);
  if (!element) {
    throw new Error(`No element found for selector: ${selector}`);
  }
  return element;
}
