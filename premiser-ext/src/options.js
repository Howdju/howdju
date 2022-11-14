import { extension as ext } from "howdju-client-common";

import { logger } from "howdju-common";

const optionDefinitions = {
  howdjuBaseUrl: {
    storageArea: "local",
    default: "https://www.howdju.com",
    defaultOnEmpty: true,
  },
  isDevelopment: {
    storageArea: "local",
    default: false,
  },
};

export function getOptions(keys, cb) {
  // TODO group options by storageArea and request all from same storageArea at same time
  // (current approach might have network latency issues for sync settings.)
  const options = {};
  keys.forEach((key) => {
    getOption(key, (value) => {
      options[key] = value;

      // Only call the callback after all options have been retrieved.
      if (Object.keys(options).length === keys.length) {
        cb(options);
      }
    });
  });
}

export function getOption(key, cb) {
  const optionDefinition = optionDefinitions[key];
  if (!optionDefinition) {
    logger.error(`No optionDefinition for key ${key}`);
    return cb(null);
  }
  ext.getStorage(optionDefinition["storageArea"], [key], (items) => {
    let value = items[key];
    if (
      value === undefined ||
      (optionDefinition["defaultOnEmpty"] && value === "")
    ) {
      value = optionDefinitions[key]["default"];
    }
    cb(value);
  });
}
