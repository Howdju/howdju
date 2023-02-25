import { useEffect, useState } from "react";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";

export function useHowdjuUrlAuthority() {
  const [isPreprodApi] = useIsPreprodApi();
  return isPreprodApi
    ? "https://pre-prod-www.howdju.com"
    : "https://www.howdju.com";
}

export function useIsPreprodApi() {
  const [isPreprodApi, setIsPreprodApi] = useState(false);
  const { getItem: readIsPreprodApi, setItem: storeIsPreprodApi } =
    useAsyncStorage("@usePreprodApi");

  async function setAndStoreUsePreprodApi(usePreprodApi: boolean) {
    await storeIsPreprodApi(usePreprodApi ? "true" : "false");
    setIsPreprodApi(usePreprodApi);
  }

  useEffect(() => {
    void (async () => {
      const usePreprodApi = await readIsPreprodApi();
      setIsPreprodApi(usePreprodApi === "true");
    })();
  }, [readIsPreprodApi]);

  return [isPreprodApi, setAndStoreUsePreprodApi] as const;
}
