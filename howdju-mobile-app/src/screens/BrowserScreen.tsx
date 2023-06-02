import React, { useContext, useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import type { ShareDataItem } from "react-native-share-menu";
import { Alert, Share, StyleSheet, View } from "react-native";
import { Appbar, TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { toJson } from "howdju-common";

import { inferSubmitUrl } from "@/services/submitUrls";
import logger from "@/logger";
import { makeRecentActivityUrl } from "@/services/urls";
import { HowdjuSiteAuthority } from "@/contexts";

export function BrowserScreen({ items }: { items: ShareDataItem[] }) {
  const webViewRef = useRef<WebView | null>(null);

  const insets = useSafeAreaInsets();
  const safeArea = {
    paddingTop: insets.top,
    // bottom is handled by the parent container.
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(undefined as string | undefined);

  function goBackward() {
    webViewRef.current?.goBack();
  }
  function goForward() {
    webViewRef.current?.goForward();
  }
  function refresh() {
    if (!webViewRef.current) {
      logger.warn("Cannot refresh because webViewRef is missing.");
      return;
    }
    webViewRef.current.reload();
  }
  async function shareCurrentUrl() {
    try {
      const result = await Share.share({
        message: currentUrl,
      });
      logger.log({ shareResult: result });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }

  const authority = useContext(HowdjuSiteAuthority);

  // Set the currentUrl whenever the share items change. Otherwise don't change it and allow
  // navigation to occur without interfering.
  useEffect(() => {
    if (!authority) {
      return;
    }
    const newCurrentUrl = items.length
      ? inferSubmitUrl(authority, items)
      : makeRecentActivityUrl(authority);
    setCurrentUrl(newCurrentUrl);
  }, [authority, items]);
  // Don't display the webview until we have a currentUrl because it requires a
  // valid URL to render and if we pass a placeholder it can enter an infinite
  // loop as the callbacks interfere with each other.
  const webView = !currentUrl ? null : (
    <WebView
      ref={(wv) => {
        webViewRef.current = wv;
      }}
      source={{ uri: currentUrl }}
      onError={({ nativeEvent }) => {
        logger.error("WebView error: ", nativeEvent);
      }}
      onHttpError={({ nativeEvent }) => {
        logger.warn("WebView HTTP error: ", nativeEvent.statusCode);
      }}
      onRenderProcessGone={({ nativeEvent }) => {
        logger.error("WebView Crashed: ", nativeEvent.didCrash);
      }}
      onNavigationStateChange={(navState) => {
        logger.debug(`WebView onNavigationStateChange: ${toJson(navState)}`);
        setCanGoBack(navState.canGoBack);
        setCanGoForward(navState.canGoForward);
        setCurrentUrl(navState.url);
      }}
      onLoadStart={({ nativeEvent }) => {
        logger.debug(`WebView onLoadStart: ${toJson(nativeEvent)}`);
      }}
      onLoadProgress={({ nativeEvent }) => {
        logger.debug(`WebView onLoadProgress: ${toJson(nativeEvent)}`);
      }}
      onLoadEnd={({ nativeEvent }) => {
        logger.debug(`WebView onLoadEnd: ${toJson(nativeEvent)}`);
        if ("navigationType" in nativeEvent) {
          const { mainDocumentURL } = nativeEvent;
          if (mainDocumentURL) {
            setCurrentUrl(mainDocumentURL);
          }
        }
      }}
      onContentProcessDidTerminate={({ nativeEvent }) => {
        logger.warn(
          `Content process terminated, reloading ${toJson(nativeEvent)}`
        );
        if (!webViewRef.current) {
          logger.error("Unable to reload webview because it is missing.");
          return;
        }
        webViewRef.current.reload();
      }}
    />
  );
  return (
    <View style={[styles.container, safeArea]}>
      {webView}
      <TextInput
        value={currentUrl}
        disabled={true}
        accessibilityLabel="Current URL"
      />
      <Appbar style={{ justifyContent: "space-evenly" }}>
        <Appbar.Action
          icon="arrow-left"
          onPress={() => goBackward()}
          disabled={!canGoBack}
          accessibilityLabel="Browser go back"
        />
        <Appbar.Action
          icon="arrow-right"
          onPress={() => goForward()}
          disabled={!canGoForward}
          accessibilityLabel="Browser go forward"
        />
        <Appbar.Action
          icon="refresh"
          onPress={() => refresh()}
          disabled={!webViewRef.current}
          accessibilityLabel="Refresh browser"
        />
        <Appbar.Action icon="share" onPress={() => void shareCurrentUrl()} />
      </Appbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default BrowserScreen;
