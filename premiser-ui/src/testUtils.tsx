import React, { PropsWithChildren } from 'react'
import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import type { PreloadedState } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import {Router} from 'react-router-dom'
import { createMemoryHistory, History } from 'history'

import type { AppStore, RootState } from './setupStore'
// As a basic setup, import your same slice reducers
import { setupStore } from './setupStore'
import { persistStore, PersistorOptions } from 'redux-persist'

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>
  store?: AppStore
  persist?: boolean
  history?: History<any>
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = setupStore(preloadedState),
    persist = true,
    history = createMemoryHistory(),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  const persistor = persistStore(store, {manualPersist: true} as PersistorOptions)
  if (persist) {
    persistor.persist()
  }
  function Wrapper({ children }: PropsWithChildren<{}>): JSX.Element {
    return (
      <Provider store={store}>
        <Router history={history}>
          {children}
        </Router>
      </Provider>
    )
  }

  // Return an object with the store and all of RTL's query functions
  return {
    store,
    persistor,
    history,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  }
}
