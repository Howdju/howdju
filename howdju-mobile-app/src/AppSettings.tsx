import React, { PropsWithChildren } from "react";

import {
  IsPreprodSite,
  HowdjuSiteAuthority,
  HOWDJU_PROD_AUTHORITY,
  HOWDJU_PREPROD_AUTHORITY,
} from "./contexts";
import { useIsPreprodApi } from "./hooks";

export default function AppSettings({ children }: PropsWithChildren<{}>) {
  const [isPreprodApi, setIsPreprodApi] = useIsPreprodApi();
  const howdjuSiteAuthority = isPreprodApi
    ? HOWDJU_PREPROD_AUTHORITY
    : HOWDJU_PROD_AUTHORITY;
  return (
    <IsPreprodSite.Provider value={{ isPreprodApi, setIsPreprodApi }}>
      <HowdjuSiteAuthority.Provider value={howdjuSiteAuthority}>
        {children}
      </HowdjuSiteAuthority.Provider>
    </IsPreprodSite.Provider>
  );
}
