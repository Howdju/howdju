import { ApiConfig } from "../config";
import { LoggerProvider } from "./loggerInit";

/**
 * The initial provider type that provides access to config vals.
 *
 * These vals come from env. vars.
 */
export interface BaseProvider {
  getConfigVal(configValName: string): string | undefined;
  getConfigVal(configValName: string, defaultConfigVal: string): string;
}

/** The values the config provider is directly responseible for. */
export interface ConfigProviderConfig {
  appConfig: ApiConfig;
  allowedOrigins: Record<string, string>;
}

/** Provides config and logger. */
export type ConfigProvider = ConfigProviderConfig & LoggerProvider;
