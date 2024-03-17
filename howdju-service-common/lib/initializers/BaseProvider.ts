import { toUpper } from "lodash";
import { ApiConfig } from "../config";
import { LoggerProvider } from "./loggerInit";

/**
 * The initial provider type that provides access to config vals.
 *
 * These vals come from env. vars.
 */
export class BaseProvider {
  constructor(
    /**
     * The API stage.
     *
     * The provider will check for config overrides based upon this stage name first,
     * and, if a stage-specific value was not found, fallback to a config value without the stage name.
     */
    protected stage: string | undefined = undefined
  ) {}

  getConfigVal(configValName: string): string | undefined;
  getConfigVal(configValName: string, defaultConfigVal: string): string;
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

/** The values the config provider is directly responseible for. */
export interface AppConfigProvider {
  appConfig: ApiConfig;
  allowedOrigins: Record<string, string>;
}

/** Provides config and logger. */
export type ConfigProvider = BaseProvider & LoggerProvider;
