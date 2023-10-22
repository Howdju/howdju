import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LocationChangeAction, LOCATION_CHANGE } from "connected-react-router";
import { ToastMessage } from "@react-md/alert";

import { ui } from "@/actions";
import paths from "../paths";
import { goto } from "../actions";
import { isWindowNarrow } from "../util";
import { Location, LocationState } from "history";

export const appSlice = createSlice({
  name: "app",
  initialState: {
    isNavDrawerVisible: false,
    isMobileSiteDisabled: false,
    isWindowNarrow: isWindowNarrow(),
    loginRedirectLocation: null as Location<LocationState> | null,
  },
  reducers: {
    showNavDrawer: (state) => {
      state.isNavDrawerVisible = true;
    },
    hideNavDrawer: (state) => {
      state.isNavDrawerVisible = false;
    },
    toggleNavDrawerVisibility: (state) => {
      state.isNavDrawerVisible = !state.isNavDrawerVisible;
    },
    setNavDrawerVisibility: (state, action: PayloadAction<boolean>) => {
      state.isNavDrawerVisible = action.payload;
    },
    captureAddMessage: {
      prepare: (reactMdAddMessage: (message: ToastMessage) => void) => ({
        payload: { reactMdAddMessage },
      }),
      // This action exists just to forward the payload to the saga
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      reducer: () => {},
    },
    addToast: {
      prepare: (text: string) => {
        const message: ToastMessage = { children: text };
        return { payload: { message } };
      },
      // This action exists just to forward the payload to the saga
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      reducer: () => {},
    },
    disableMobileSite: (state) => {
      state.isMobileSiteDisabled = true;
    },
    enableMobileSite: (state) => {
      state.isMobileSiteDisabled = false;
    },
  },
  extraReducers(builder) {
    builder.addCase(ui.windowResize, (state) => {
      state.isWindowNarrow = isWindowNarrow();
    });
    builder.addCase(LOCATION_CHANGE, (state, action: LocationChangeAction) => {
      if (action.payload.location.pathname !== paths.login()) {
        return { ...state, loginRedirectLocation: null };
      }
      return state;
    });
    builder.addCase(goto.login, (state, action) => {
      state.loginRedirectLocation = action.payload.loginRedirectLocation;
    });
  },
});

export default appSlice.actions;
export const app = appSlice.reducer;
