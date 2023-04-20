/// <reference path="../../howdju-test-common/lib/globals.d.ts" />

// Babel runtime dependencies
import "core-js/stable";
import "regenerator-runtime/runtime";

// Must come before react
import "react-hot-loader";

import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { Configuration } from "@react-md/layout";
import { FormThemeProvider } from "@react-md/form";
import moment from "moment";
import momentDurationFormatSetup from "moment-duration-format";

import App from "./App";
import config from "./config";
import { cookieConsent, ERROR_REPORTING } from "./cookieConsent";
import { store } from "./store";
import sentryInit from "./sentryInit";

if (config.sentry.enabled && cookieConsent.isAccepted(ERROR_REPORTING)) {
  sentryInit();
}

momentDurationFormatSetup(moment);

const root = document.getElementById("root");

// type: ConfigurationProps
const overrides = {
  // your react-md configuration overrides
};

render(
  <Provider store={store}>
    {/* TODO(17) form inputs don't appear to pick this up. */}
    <FormThemeProvider theme="underline">
      <Configuration {...overrides}>
        <App />
      </Configuration>
    </FormThemeProvider>
  </Provider>,
  root
);
