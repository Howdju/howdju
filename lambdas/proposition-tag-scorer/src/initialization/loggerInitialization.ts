import { loggerInit } from "howdju-service-common";
import { baseProvider } from "./baseInit";

export const { logger } = loggerInit(baseProvider);
