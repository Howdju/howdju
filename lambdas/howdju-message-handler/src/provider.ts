import { AppProvider, LambdaProvider } from "./LambdaProvider";

// TODO(#486) construct provider based on the stage like in getOrCreateAppProvider.
const stage = undefined;
export const provider = new LambdaProvider(stage) as unknown as AppProvider;
