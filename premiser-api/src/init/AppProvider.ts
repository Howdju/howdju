import { assign } from "lodash";

import {
  AppConfigProvider,
  AsyncConfig,
  awsInit,
  AwsProvider,
  BaseProvider,
  ConfigProvider,
  daosInitializer,
  databaseInit,
  DatabaseProvider,
  loggerInit,
  LoggerProvider,
  searchersInitializer,
  servicesInitializer,
  ServicesProvider,
  validatorsInitializer,
} from "howdju-service-common";
import { makeConfig } from "./configInit";

/**
 * A dependency locator.
 *
 * The benefit of this locator is that it's simple and it encourages SRP in our classes. Downsides
 * include that it's toilsome to change deps since we hard code their relations.
 *
 * TODO(#106): configure a DI container.
 */
export class ApiProvider extends BaseProvider {
  // TODO(331) this appears to be unused.
  isProduction: boolean;

  constructor(stage: string | undefined, asyncConfig: Promise<AsyncConfig>) {
    super(stage);

    this.isProduction = this.getConfigVal("NODE_ENV") === "production";

    assign(this, loggerInit(this));
    assign(this, makeConfig(this as unknown as LoggerProvider));
    assign(this, databaseInit(this as unknown as ConfigProvider, asyncConfig));
    assign(this, daosInitializer(this as unknown as DatabaseProvider));
    assign(this, validatorsInitializer(this as unknown as LoggerProvider));
    assign(this, awsInit(this as unknown as LoggerProvider));
    assign(
      this,
      servicesInitializer(
        this as unknown as AwsProvider & AppConfigProvider,
        asyncConfig
      )
    );
    assign(this, searchersInitializer(this as unknown as ServicesProvider));

    (this as unknown as LoggerProvider).logger.debug(
      "AppProvider initialization complete"
    );
  }
}
