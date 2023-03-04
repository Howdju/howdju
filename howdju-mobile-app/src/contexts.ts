import { createContext } from "react";
import { HowdjuInstanceName } from "./hooks";

export const HOWDJU_PROD_AUTHORITY = "https://www.howdju.com/";
export const HOWDJU_PREPROD_AUTHORITY = "https://pre-prod-www.howdju.com";
export const HOWDJU_LOCAL_AUTHORITY = "http://localhost:3000";

export const HowdjuInstance = createContext({
  howdjuInstance: "PROD",
  setHowdjuInstance: (instance: HowdjuInstanceName): Promise<void> =>
    Promise.reject(
      `Default setter ignoring context update: setHowdjuInstance(${instance}).`
    ),
});

export const HowdjuSiteAuthority = createContext(HOWDJU_PROD_AUTHORITY);
