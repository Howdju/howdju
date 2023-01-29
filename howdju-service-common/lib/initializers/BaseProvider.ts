import { ApiConfig } from "../config";
import { LoggerProvider } from "./loggerInit";

export interface BaseProvider {
  getConfigVal(configValName: string): string | undefined;
  getConfigVal(configValName: string, defaultConfigVal: string): string;
}

export type ConfigProvider = {
  appConfig: ApiConfig;
  allowedOrigins: Record<string, string>;
} & LoggerProvider;
