import React, { PropsWithChildren } from 'react'
import { render } from '@testing-library/react'
import type { RenderOptions } from '@testing-library/react'
import type { PreloadedState } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import {Router} from 'react-router-dom'
import { createMemoryHistory, History } from 'history'
import { persistStore, PersistorOptions } from 'redux-persist'

import type { AppStore, RootState } from './setupStore'
import { setupStore } from './setupStore'

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

  return {
    store,
    persistor,
    history,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  }
}
