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
  AwsProvider,
  ServicesProvider,
  baseConfig,
  BaseProvider,
} from "howdju-service-common";

export type AppProvider = ServicesProvider;

/**
 * A dependency locator.
 *
 * The benefit of this locator is that it's simple and it encourages SRP in our classes. Downsides
 * include that it's toilsome to change deps since we hard code their relations.
 *
 * TODO(106): consolidate with ApiProvider
 */
export class LambdaProvider implements BaseProvider {
  constructor() {
    assign(this, loggerInit(this));
    assign(this, { appConfig: baseConfig });
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

    if (Object.prototype.hasOwnProperty.call(process.env, configValName)) {
      configVal = process.env[configValName];
    }

    return configVal;
  }
}
