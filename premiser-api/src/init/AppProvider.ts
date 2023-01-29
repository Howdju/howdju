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

export type AppProvider = ServicesProvider;

export type ServicesProvider2 = ReturnType<typeof servicesInitializer> &
  AwsProvider;

export class ApiProvider implements BaseProvider {
  stage: string | undefined;
  isProduction: boolean;

  constructor(stage: string | undefined) {
    this.stage = stage;
    this.isProduction = this.getConfigVal("NODE_ENV") === "production";

    // This is our hacky dependency injection
    // TODO(106): configure real dependency injection
    assign(this, loggerInit(this));
    assign(this, makeConfig(this as unknown as LoggerProvider));
    assign(this, databaseInit(this as unknown as ConfigProvider));
    assign(this, daosInitializer(this as unknown as DatabaseProvider));
    assign(this, searchersInitializer(this as unknown as DatabaseProvider));
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
