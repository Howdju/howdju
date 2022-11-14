import { api } from "@/apiActions";
import { createSlice } from "@reduxjs/toolkit";
import { AccountSettings } from "howdju-common";

export const accountSettingsPageSlice = createSlice({
  name: "accountSettingsPage",
  initialState: {
    accountSettings: null as AccountSettings | null,
    isFetching: false,
  },
  reducers: {},
  extraReducers(builder) {
    builder.addCase(api.fetchAccountSettings, (state) => {
      state.isFetching = true;
    });
    builder.addCase(api.fetchAccountSettings.response, (state, action) => {
      state.isFetching = false;
      if (action.error) {
        state.accountSettings = null;
        return;
      }
      state.accountSettings = action.payload.accountSettings;
    });
    builder.addCase(api.updateAccountSettings.response, (state, action) => {
      state.accountSettings = action.payload.accountSettings;
    });
  },
});

export default accountSettingsPageSlice.actions;
export const accountSettingsPage = accountSettingsPageSlice.reducer;
