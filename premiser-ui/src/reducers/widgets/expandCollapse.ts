import { createReducer } from "@reduxjs/toolkit";

import { ui } from "../../actions";

interface WidgetState {
  isExpanded: boolean;
}

function defaultWidgetState() {
  return {
    isExpanded: false,
  };
}

const initialState: Record<string, WidgetState> = {};

export default createReducer(initialState, (builder) => {
  builder.addCase(ui.expand, (state, { payload: { widgetId } }) => {
    if (!state[widgetId]) {
      state[widgetId] = defaultWidgetState();
    }
    state[widgetId].isExpanded = true;
  });
  builder.addCase(ui.collapse, (state, { payload: { widgetId } }) => {
    if (!state[widgetId]) {
      state[widgetId] = defaultWidgetState();
    }
    state[widgetId].isExpanded = false;
  });
});
