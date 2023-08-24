import { assign } from "lodash";

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
  DaosProvider,
} from "howdju-service-common";

/**
 * A dependency locator.
 *
 * The benefit of this locator is that it's simple and it encourages SRP in our classes. Downsides
 * include that it's toilsome to change deps since we hard code their relations.
 *
 * TODO(106): configure a DI container.
 */
export class MigrateProvider implements BaseProvider {
  appConfig: object;
  constructor() {
    assign(this, loggerInit(this));
    this.appConfig = {};
    assign(this, databaseInit(this as unknown as ConfigProvider));
    assign(this, daosInitializer(this as unknown as DatabaseProvider));
    assign(this, searchersInitializer(this as unknown as DaosProvider));
    assign(this, validatorsInitializer(this as unknown as LoggerProvider));
    assign(this, awsInit(this as unknown as LoggerProvider));
    assign(this, servicesInitializer(this as unknown as AwsProvider));

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

    if (
      !foundConfigVal &&
      Object.prototype.hasOwnProperty.call(process.env, configValName)
    ) {
      configVal = process.env[configValName];
    }

    return configVal;
  }
}
