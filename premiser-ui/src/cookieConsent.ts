import CookieConsent from "@grrr/cookie-consent";
import forEach from "lodash/some";
import keyBy from "lodash/keyBy";
import isUndefined from "lodash/isUndefined";
import some from "lodash/some";

import { fromJson, toJson } from "howdju-common";

import { logger } from "./logger";

import "@grrr/cookie-consent/styles/cookie-consent.scss";

export const REQUIRED_FUNCTIONALITY = "required-functionality";
export const BASIC_FUNCTIONALITY = "basic-functionality";
export const LIVE_CHAT = "live-chat";
export const ERROR_REPORTING = "error-reporting";
export const FULL_ERROR_REPORTING = "full-error-reporting";
export const ANALYTICS = "analytics";

const PREFS_LOCAL_STORAGE_KEY = "cookie-consent-preferences";

let haveAppendedDialog = false;

const settings = {
  // The dialog flashes even when consent has already been given. So add it ourselves.
  append: false,
  labels: {
    title: "Privacy consent",
    description: `<p>This site makes use of web technologies in order to provide . Read more in our
                  <a href="/policies/privacy-policy">privacy policy</a>.</p>
                  <p>Please note that removing consent previously given requires reloading the page in order to take
                   effect.</p>`,
  },
  cookies: [
    {
      id: REQUIRED_FUNCTIONALITY,
      label: "Required functionality",
      description: "Persists your response to this dialog.",
      required: true,
    },
    {
      id: BASIC_FUNCTIONALITY,
      label: "Basic functionality",
      description: `Stores your authentication token so that you don't have to login every time you open the app.`,
    },
    {
      id: LIVE_CHAT,
      label: "Live chat",
      description:
        "Enables Smallchat so that you can chat with us for support. May require a reload to re-enable.",
    },
    {
      id: ERROR_REPORTING,
      label: "Error reporting",
      description:
        "Enables Sentry.io integration for submitting error reports to help us fix problems.",
    },
    {
      id: FULL_ERROR_REPORTING,
      label: "Full error reporting",
      description: `Enables activity tracing to help us diagnose problems. May transmit activity
                    you perform on our site to Sentry.io's servers. Has no effect if Error reporting is disabled.
                    Changing this setting requires a reload of the app to take effect.`,
    },
    {
      id: ANALYTICS,
      label: "Analytics",
      description: `Enables Google Analytics for reporting on aggregated usage of our app to make improvements.
                    Changing this setting requires a reload of the website to take effect.`,
    },
  ],
} as const;

export type CookieId = typeof settings["cookies"][number]["id"];

export interface Cookie {
  id: CookieId;
  accepted: boolean;
}

export const cookieConsent = CookieConsent(settings);

export function isMissingPrivacyConsent() {
  const currentIds = keyBy(cookieConsent.getPreferences(), "id");
  const validIds = keyBy(settings.cookies, "id");
  return some(validIds, (_val, id) => isUndefined(currentIds[id]));
}

export function showPrivacyConsentDialog() {
  if (!haveAppendedDialog) {
    document.body.appendChild(cookieConsent.getDialog());
    haveAppendedDialog = true;
  }
  cookieConsent.showDialog();
}

export function fixConsentCookieIds() {
  const validIds = keyBy(settings.cookies, "id");
  const prefsJson = window.localStorage.getItem(PREFS_LOCAL_STORAGE_KEY);
  if (!prefsJson) {
    logger.error(
      `Cannot fixConsentCookieIds because localStorage[${PREFS_LOCAL_STORAGE_KEY} is missing.`
    );
    return;
  }
  const prefs = fromJson(prefsJson);
  const newPrefs: Cookie[] = [];
  forEach(prefs, (pref) => {
    if (!validIds[pref.id]) {
      logger.debug(`dropping invalid cookie consent pref ${toJson(pref)}`);
      return;
    }
    newPrefs.push(pref);
  });
  window.localStorage.setItem(PREFS_LOCAL_STORAGE_KEY, toJson(newPrefs));
}
