import React, { PropsWithChildren } from "react";

import {
  HowdjuSiteAuthority,
  HOWDJU_PROD_AUTHORITY,
  HOWDJU_PREPROD_AUTHORITY,
  HOWDJU_LOCAL_AUTHORITY,
  HowdjuInstance,
} from "./contexts";
import {
  HowdjuInstance as HowdjuInstanceType,
  useHowdjuInstance,
} from "./hooks";

export default function AppSettings({ children }: PropsWithChildren<{}>) {
  const [howdjuInstance, setHowdjuInstance] = useHowdjuInstance();
  return (
    <HowdjuInstance.Provider value={{ howdjuInstance, setHowdjuInstance }}>
      <HowdjuSiteAuthority.Provider
        value={toHowdjuSiteAuthority(howdjuInstance)}
      >
        {children}
      </HowdjuSiteAuthority.Provider>
    </HowdjuInstance.Provider>
  );
}

function toHowdjuSiteAuthority(instance: HowdjuInstanceType) {
  switch (instance) {
    case "PROD":
      return HOWDJU_PROD_AUTHORITY;
    case "PREPROD":
      return HOWDJU_PREPROD_AUTHORITY;
    case "LOCAL":
      return HOWDJU_LOCAL_AUTHORITY;
  }
}
