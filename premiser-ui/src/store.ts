import { Reducer } from 'redux'
import { PreloadedState } from '@reduxjs/toolkit'
import { persistStore, PersistorOptions } from 'redux-persist'

import { logger } from './logger'

import { RootReducer, setupStore } from "./setupStore"

declare global {
  interface Window {
    __INITIAL_STATE__?: PreloadedState<ExtractReducerState<RootReducer>>
  }
}
type ExtractReducerState<T> = T extends Reducer<infer S> ? S : never

const store = setupStore(window.__INITIAL_STATE__)

const persistor = persistStore(store, {manualPersist: true} as PersistorOptions)

export {store, persistor}

// Tell the persistor to start persisting.
//
// See manualPersist at
// https://github.com/rt2zz/redux-persist#persiststorestore-config-callback
export function startPersisting() {
  persistor.persist()
}

export function stopPersisting() {
  persistor.pause()
  persistor.purge().catch(err => {
    logger.error("Failed to purge redux persistance.")
    logger.exception(err)
  })
}
