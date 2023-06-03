import { useEffect, useState } from "react";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import isUrl from "validator/lib/isURL";
import { isString } from "lodash";

import logger from "./logger";
import { DEFAULT_LOCAL_INSTANCE_ADDRESS } from "./contexts";

const howdjuInstances = ["PROD", "PREPROD", "LOCAL"] as const;
export type HowdjuInstanceName = typeof howdjuInstances[number];

export function useHowdjuInstance() {
  const [howdjuInstance, setHowdjuInstance] = useState<
    HowdjuInstanceName | undefined
  >(undefined);
  const { getItem: readHowdjuInstance, setItem: storeHowdjuInstance } =
    useAsyncStorage("@howdjuInstance");

  async function setAndStoreHowdjuInstance(instance: HowdjuInstanceName) {
    await storeHowdjuInstance(instance);
    setHowdjuInstance(instance);
  }

  // Read the setting and track it in our state
  useEffect(() => {
    async function readAndSetState() {
      const howdjuInstance = await readHowdjuInstance();
      if (isHowdjuInstance(howdjuInstance)) {
        setHowdjuInstance(howdjuInstance);
        return;
      }
      if (howdjuInstance) {
        logger.error(
          `Read invalid howdjuInstance ${howdjuInstance}. Resetting to PROD`
        );
      }
      await storeHowdjuInstance("PROD");
      setHowdjuInstance("PROD");
    }

    void readAndSetState();
  }, [readHowdjuInstance, storeHowdjuInstance]);

  return [howdjuInstance, setAndStoreHowdjuInstance] as const;
}

/** Hook for getting/setting the address for when the local Howdju instance is active. */
export function useLocalInstanceAddress() {
  const [localInstanceAddress, setLocalInstanceAddress] = useState<string>("");
  const {
    getItem: readLocalInstanceAddress,
    setItem: storeLocalInstanceAddress,
  } = useAsyncStorage("@localInstanceAddress");

  async function setAndStoreLocalInstanceAddress(address: string) {
    await storeLocalInstanceAddress(address);
    setLocalInstanceAddress(address);
  }

  // Read the setting and track it in our state
  useEffect(() => {
    async function readAndSetState() {
      const address = await readLocalInstanceAddress();
      if (isValidLocalInstanceAddress(address)) {
        setLocalInstanceAddress(address);
        return;
      }
      if (address) {
        logger.error(
          `Read invalid howdjuInstance ${address}. Resetting to PROD`
        );
      }
      await storeLocalInstanceAddress(DEFAULT_LOCAL_INSTANCE_ADDRESS);
      setLocalInstanceAddress(DEFAULT_LOCAL_INSTANCE_ADDRESS);
    }

    void readAndSetState();
  }, [readLocalInstanceAddress, storeLocalInstanceAddress]);

  return [localInstanceAddress, setAndStoreLocalInstanceAddress] as const;
}
function isHowdjuInstance(val: any): val is HowdjuInstanceName {
  return howdjuInstances.includes(val);
}

export function isValidLocalInstanceAddress(val: any): val is string {
  if (!isString(val)) {
    return false;
  }
  return isUrl(val, {
    protocols: ["http", "https"],
    require_tld: false,
  });
}
