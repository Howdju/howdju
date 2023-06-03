import { createContext } from "react";
import { HowdjuInstanceName } from "./hooks";

export const HOWDJU_PROD_AUTHORITY = "https://www.howdju.com/";
export const HOWDJU_PREPROD_AUTHORITY = "https://pre-prod-www.howdju.com";
export const DEFAULT_LOCAL_INSTANCE_ADDRESS = "http://localhost:3000";

export const HowdjuInstance = createContext({
  howdjuInstance: undefined as HowdjuInstanceName | undefined,
  setHowdjuInstance: (instance: HowdjuInstanceName): Promise<void> =>
    Promise.reject(
      `Default setter ignoring context update: setHowdjuInstance(${instance}).`
    ),
});

export const LocalInstanceAddress = createContext({
  localInstanceAddress: undefined as string | undefined,
  setLocalInstanceAddress: (address: string): Promise<void> =>
    Promise.reject(
      `Default setter ignoring context update: setLocalInstanceAddress(${address}).`
    ),
});

export const HowdjuSiteAuthority = createContext(
  undefined as string | undefined
);
