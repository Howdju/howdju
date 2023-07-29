import { AppProvider, LambdaProvider } from "./LambdaProvider";

export const provider = new LambdaProvider() as unknown as AppProvider;
