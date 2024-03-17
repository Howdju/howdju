import { ConfigProvider, getParameterStoreConfig } from "howdju-service-common";
import { databaseInit } from "howdju-service-common/lib/initializers/databaseInit";

import { logger } from "./loggerInitialization";
import { baseProvider } from "./baseInit";

const configProvider = { ...baseProvider, logger } as ConfigProvider;
// TODO(#486) handle environments for proposition-tag-scorer
const parameterStoreConfig = getParameterStoreConfig("prod");
export const { database } = databaseInit(configProvider, parameterStoreConfig);
