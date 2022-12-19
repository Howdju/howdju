const toUpper = require("lodash/toUpper");

const {
  daosInitializer,
  searchersInitializer,
  validatorsInitializer,
  servicesInitializer,
} = require("howdju-service-common");

const loggerInit = require("./loggerInit");
const configInit = require("./configInit");
const databaseInit = require("./databaseInit");
const awsInit = require("./awsInit");

exports.AppProvider = class AppProvider {
  constructor(stage) {
    this.stage = stage;
    this.isProduction = this.getConfigVal("NODE_ENV") === "production";

    // This is our hacky dependency injection
    // TODO(106): configure real dependency injection
    loggerInit.init(this);
    configInit.init(this);
    databaseInit.init(this);
    daosInitializer(this);
    searchersInitializer(this);
    validatorsInitializer(this);
    awsInit.init(this);
    servicesInitializer(this);

    this.logger.debug("AppProvider initialization complete");
  }

  getConfigVal(configValName, defaultConfigVal) {
    let configVal = defaultConfigVal;
    let foundConfigVal = false;

    if (this.stage) {
      const stageConfigValName = `${configValName}__${toUpper(this.stage)}`;
      if (
        Object.prototype.hasOwnProperty.call(process.env, stageConfigValName)
      ) {
        configVal = process.env[stageConfigValName];
        foundConfigVal = true;
      }
    }

    if (
      !foundConfigVal &&
      Object.prototype.hasOwnProperty.call(process.env, configValName)
    ) {
      configVal = process.env[configValName];
    }

    return configVal;
  }
};
