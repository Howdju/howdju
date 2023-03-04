import { useEffect, useState } from "react";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";

import logger from "./logger";

const howdjuInstances = ["PROD", "PREPROD", "LOCAL"] as const;
export type HowdjuInstanceName = typeof howdjuInstances[number];

export function useHowdjuInstance() {
  const [howdjuInstance, setHowdjuInstance] =
    useState<HowdjuInstanceName>("PROD");
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
      if (!howdjuInstance) {
        // First time read or possible after settings are reset, it will be null
        await storeHowdjuInstance("PROD");
        setHowdjuInstance("PROD");
        return;
      }
      logger.error(
        `Read invalid howdjuInstance ${howdjuInstance}. Resetting to PROD`
      );
      await storeHowdjuInstance("PROD");
      setHowdjuInstance("PROD");
    }

    void readAndSetState();
  }, [readHowdjuInstance, storeHowdjuInstance]);

  return [howdjuInstance, setAndStoreHowdjuInstance] as const;
}

function isHowdjuInstance(val: any): val is HowdjuInstanceName {
  return howdjuInstances.includes(val);
}
