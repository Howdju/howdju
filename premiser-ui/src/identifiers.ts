// Levels of identifiers: LocalStorageID, Cookie ID, SessionCookieID, SessionStorageID, page load/app run ID ID, Request ID
import { v4 as uuidv4 } from "uuid";
import get from "lodash/get";
import config from "./config";

export const newId = () => uuidv4();

export const pageLoadId = newId();

export const getOrCreateSessionStorageId = () => {
  let sessionStorageId = getSessionStorageId();
  if (!sessionStorageId) {
    sessionStorageId = createSessionStorageId();
  }
  return sessionStorageId;
};

export const getSessionStorageId = () => {
  return get(window, ["sessionStorage", "ssid"]);
};

const createSessionStorageId = () => {
  if (window.sessionStorage) {
    const ssid = newId();
    try {
      window.sessionStorage.setItem(config.sessionStorageIdKey, ssid);
      return ssid;
    } catch (err) {
      // sessionStorage is unavailable in Safari private mode
    }
  }
  return undefined;
};

export const clearSessionStorageId = () => {
  window.sessionStorage.removeItem(config.sessionStorageIdKey);
};
