import { createContext } from "react";

export const HOWDJU_PROD_AUTHORITY = "https://www.howdju.com/";
export const HOWDJU_PREPROD_AUTHORITY = "https://pre-prod-www.howdju.com";

export const IsPreprodSite = createContext({
  isPreprodApi: false,
  setIsPreprodApi: (val: boolean): Promise<void> =>
    Promise.reject(
      `Default setter ignoring context update: setIsPreprodApi(${val}).`
    ),
});

export const HowdjuSiteAuthority = createContext(HOWDJU_PROD_AUTHORITY);
