import React, { useRef } from "react";
import { WebView } from "react-native-webview";
import type { ShareDataItem } from "react-native-share-menu";

import { inferSubmitUrl } from "@/services/submitUrls";
import logger from "@/logger";
import { useHowdjuUrlAuthority } from "@/hooks";
import { makeRecentActivityUrl } from "@/services/urls";

export function BrowserScreen({ items }: { items: ShareDataItem[] }) {
  const webViewRef = useRef<WebView | null>(null);

  const authority = useHowdjuUrlAuthority();
  const browserUrl = items.length
    ? inferSubmitUrl(authority, items)
    : makeRecentActivityUrl(authority);
  return (
    <WebView
      ref={(wv) => {
        webViewRef.current = wv;
      }}
      source={{ uri: browserUrl }}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error("WebView error: ", nativeEvent);
      }}
      onHttpError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn("WebView HTTP error: ", nativeEvent.statusCode);
      }}
      onRenderProcessGone={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn("WebView Crashed: ", nativeEvent.didCrash);
      }}
      onContentProcessDidTerminate={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn("Content process terminated, reloading", nativeEvent);
        if (!webViewRef.current) {
          logger.warn("Unable to reload webview because it is missing.");
          return;
        }
        webViewRef.current.reload();
      }}
    />
  );
}

export default BrowserScreen;
