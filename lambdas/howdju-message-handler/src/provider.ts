import { getParameterStoreConfig } from "howdju-service-common";
import { AppProvider, LambdaProvider } from "./LambdaProvider";

// TODO(#486) construct provider based on the stage like in getOrCreateAppProvider.
const stage = undefined;
// TODO(#486) handle environments for howdju-message-handler
const parameterStoreConfig = getParameterStoreConfig("prod");
export const provider = new LambdaProvider(
  stage,
  parameterStoreConfig
) as unknown as AppProvider;
