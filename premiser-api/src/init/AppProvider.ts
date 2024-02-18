import { assign, toUpper } from "lodash";

import {
  daosInitializer,
  searchersInitializer,
  validatorsInitializer,
  servicesInitializer,
  awsInit,
  loggerInit,
  LoggerProvider,
  ConfigProvider,
  databaseInit,
  DatabaseProvider,
  BaseProvider,
  AwsProvider,
  ServicesProvider,
} from "howdju-service-common";
import { makeConfig } from "./configInit";

/**
 * A dependency locator.
 *
 * The benefit of this locator is that it's simple and it encourages SRP in our classes. Downsides
 * include that it's toilsome to change deps since we hard code their relations.
 *
 * TODO(106): configure a DI container.
 */
export class ApiProvider implements BaseProvider {
  // The API stage.

  // The provider will check for config overrides based upon this stage name first,
  // and, if a stage-specific value was not found, fallback to a config value without the stage name.
  stage: string | undefined;
  // TODO(331) this appears to be unused.
  isProduction: boolean;

  constructor(stage: string | undefined) {
    this.stage = stage;
    this.isProduction = this.getConfigVal("NODE_ENV") === "production";

    assign(this, loggerInit(this));
    assign(this, makeConfig(this as unknown as LoggerProvider));
    assign(this, databaseInit(this as unknown as ConfigProvider));
    assign(this, daosInitializer(this as unknown as DatabaseProvider));
    assign(this, validatorsInitializer(this as unknown as LoggerProvider));
    assign(this, awsInit(this as unknown as LoggerProvider));
    assign(this, servicesInitializer(this as unknown as AwsProvider));
    assign(this, searchersInitializer(this as unknown as ServicesProvider));

    (this as unknown as LoggerProvider).logger.debug(
      "AppProvider initialization complete"
    );
  }

  getConfigVal(configValName: string): string;
  getConfigVal(
    configValName: string,
    defaultConfigVal: string | undefined = undefined
  ) {
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
}
