import React, { useContext } from "react";
import type { ShareDataItem } from "react-native-share-menu";
import { URL } from "react-native-url-polyfill";
import useDeepCompareEffect from "use-deep-compare-effect";

import { toJson } from "howdju-common";

import { inferSubmitUrl } from "@/services/submitUrls";
import logger from "@/logger";
import { makeRecentActivityUrl } from "@/services/urls";
import { HowdjuSiteAuthority } from "@/contexts";
import Browser from "@/components/Browser";

export function BrowserScreen({
  shareDataItems,
}: {
  shareDataItems: ShareDataItem[];
}) {
  const howdjuSiteAuthority = useContext(HowdjuSiteAuthority);

  const [url, setUrl] = React.useState(undefined as string | undefined);

  // Initialize the URL any time the authority or share items change.
  useDeepCompareEffect(() => {
    if (!howdjuSiteAuthority) {
      return;
    }
    if (shareDataItems.length) {
      // Regardless of whether the authority or the share items changed, if
      // there are changed share items, we should navigate to consume them.
      setUrl(inferSubmitUrl(howdjuSiteAuthority, shareDataItems));
    } else if (!url || isHowdjuUrl(url)) {
      // Otherwise, only navigate if we have no URL or are already on a Howdju URL.
      setUrl(makeRecentActivityUrl(howdjuSiteAuthority));
    }
  }, [howdjuSiteAuthority, shareDataItems]);

  return (
    <Browser
      url={url}
      onUrlChange={(url) => setUrl(url)}
      onNavigationStateChange={(navState) => {
        logger.debug(`WebView onNavigationStateChange: ${toJson(navState)}`);
      }}
      onLoadStart={({ nativeEvent }) => {
        logger.debug(`WebView onLoadStart: ${toJson(nativeEvent)}`);
      }}
      onLoadProgress={({ nativeEvent: { progress } }) => {
        logger.debug(`WebView onLoadProgress: ${toJson({ progress })}`);
      }}
      onLoadEnd={({ nativeEvent }) => {
        logger.debug(`WebView onLoadEnd: ${toJson(nativeEvent)}`);
      }}
      onMessage={({ nativeEvent: { data } }) => {
        logger.debug(`WebView onMessage: ${data}`);
      }}
      onContentProcessDidTerminate={({ nativeEvent }) => {
        logger.warn(
          `Content process terminated, reloading ${toJson(nativeEvent)}`
        );
      }}
      onError={({ nativeEvent }) => {
        logger.error("WebView error: ", nativeEvent);
      }}
      onHttpError={({ nativeEvent }) => {
        logger.warn("WebView HTTP error: ", nativeEvent.statusCode);
      }}
      onRenderProcessGone={({ nativeEvent }) => {
        logger.error("WebView Crashed: ", nativeEvent.didCrash);
      }}
    />
  );
}

function isHowdjuUrl(url: string | undefined) {
  if (!url) {
    return false;
  }
  const urlObject = new URL(url);
  return (
    urlObject.hostname === "howdju.com" ||
    urlObject.hostname.endsWith(".howdju.com")
  );
}

export default BrowserScreen;
