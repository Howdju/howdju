import React, { PropsWithChildren } from "react";

import { EmptyObject } from "howdju-common";

import {
  HowdjuSiteAuthority,
  HOWDJU_PROD_AUTHORITY,
  HOWDJU_PREPROD_AUTHORITY,
  HowdjuInstance,
  LocalInstanceAddress,
} from "./contexts";
import {
  HowdjuInstanceName,
  useHowdjuInstance,
  useLocalInstanceAddress,
} from "./hooks";

export default function AppSettings({
  children,
}: PropsWithChildren<EmptyObject>) {
  const [howdjuInstance, setHowdjuInstance] = useHowdjuInstance();
  const [localInstanceAddress, setLocalInstanceAddress] =
    useLocalInstanceAddress();
  return (
    <HowdjuInstance.Provider value={{ howdjuInstance, setHowdjuInstance }}>
      <LocalInstanceAddress.Provider
        value={{ localInstanceAddress, setLocalInstanceAddress }}
      >
        <HowdjuSiteAuthority.Provider
          value={toHowdjuSiteAuthority(howdjuInstance, localInstanceAddress)}
        >
          {children}
        </HowdjuSiteAuthority.Provider>
      </LocalInstanceAddress.Provider>
    </HowdjuInstance.Provider>
  );
}

function toHowdjuSiteAuthority(
  instance: HowdjuInstanceName | undefined,
  localInstanceAddress: string
) {
  if (!instance) {
    return undefined;
  }
  switch (instance) {
    case "PROD":
      return HOWDJU_PROD_AUTHORITY;
    case "PREPROD":
      return HOWDJU_PREPROD_AUTHORITY;
    case "LOCAL":
      return localInstanceAddress;
  }
}
