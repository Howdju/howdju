
import { createSlice, PayloadAction } from "@reduxjs/toolkit"
import {LocationChangeAction, LOCATION_CHANGE} from 'connected-react-router'

import { ui } from "@/actions"
import paths from '../paths'
import {goto} from "../actions"
import {isWindowNarrow} from "../util"
import { Location, LocationState } from "history"

export interface ToastData {
  text: string
}

export const app = createSlice({
  name: "app",
  initialState: {
    canHover: false,
    isNavDrawerVisible: false,
    isMobileSiteDisabled: false,
    isWindowNarrow: isWindowNarrow(),
    loginRedirectLocation: null as Location<LocationState> | null,
    toasts: [] as ToastData[],
  },
  reducers: {
    showNavDrawer: (state) => {
      state.isNavDrawerVisible = true
    },
    hideNavDrawer: (state) => {
      state.isNavDrawerVisible = false
    },
    toggleNavDrawerVisibility: (state) => {
      state.isNavDrawerVisible = !state.isNavDrawerVisible
    },
    setNavDrawerVisibility: (state, action: PayloadAction<boolean>) => {
      state.isNavDrawerVisible = action.payload
    },
    addToast: {
      prepare: (text: string) => ({payload: { text }}),
      reducer: (state, action: PayloadAction<ToastData>) => {
        state.toasts.push(action.payload)
      },
    },
    dismissToast: (state) => {
      state.toasts = state.toasts.slice(1);
    },
    setCanHover: {
      prepare: (canHover: boolean) => ({payload: {canHover}}),
      reducer: (state, action: PayloadAction<{canHover: boolean}>) => {
        state.canHover = action.payload.canHover
      }
    },
    disableMobileSite: (state) => {
      state.isMobileSiteDisabled = true
    },
    enableMobileSite: (state) => {
      state.isMobileSiteDisabled = false
    },
  },
  extraReducers(builder) {
    builder.addCase(ui.windowResize, (state) => {
      state.isWindowNarrow = isWindowNarrow()
    })
    builder.addCase(LOCATION_CHANGE, (state, action: LocationChangeAction) => {
      if (action.payload.location.pathname !== paths.login()) {
        return {...state, loginRedirectLocation: null}
      }
      return state
    })
    builder.addCase(goto.login, (state, action) => {
      state.loginRedirectLocation = action.payload.loginRedirectLocation
    })
  }
})

export default app.actions
