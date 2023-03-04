import React, { useContext, useEffect, useRef, useState } from "react";
import { WebView } from "react-native-webview";
import type { ShareDataItem } from "react-native-share-menu";
import { Alert, Share, StyleSheet, View } from "react-native";
import { Appbar, TextInput, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const [currentUrl, setCurrentUrl] = useState("");

  function goBackward() {
    webViewRef.current?.goBack();
  }
  function goForward() {
    webViewRef.current?.goForward();
  }
  function refresh() {
    if (!webViewRef.current) {
      console.warn("Cannot refresh because webViewRef is missing.");
      return;
    }
    webViewRef.current.reload();
  }
  async function shareCurrentUrl() {
    try {
      const result = await Share.share({
        message: currentUrl,
      });
      console.log({ shareResult: result });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }

  const authority = useContext(HowdjuSiteAuthority);

  // Set the currentUrl whenever the share items change. Otherwise don't change it and allow
  // navigation to occur without interfering.
  useEffect(() => {
    const itemsUrl = items.length
      ? inferSubmitUrl(authority, items)
      : makeRecentActivityUrl(authority);
    setCurrentUrl(itemsUrl);
  }, [authority, items]);
  return (
    <View style={[styles.container, safeArea]}>
      <WebView
        ref={(wv) => {
          webViewRef.current = wv;
        }}
        source={{ uri: currentUrl }}
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
          console.error("WebView Crashed: ", nativeEvent.didCrash);
        }}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          setCanGoForward(navState.canGoForward);
          setCurrentUrl(navState.url);
        }}
        onContentProcessDidTerminate={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn("Content process terminated, reloading", nativeEvent);
          if (!webViewRef.current) {
            logger.error("Unable to reload webview because it is missing.");
            return;
          }
          webViewRef.current.reload();
        }}
      />
      <TextInput value={currentUrl} disabled={true} />
      <Appbar>
        <Appbar.Action
          icon="arrow-left"
          onPress={() => goBackward()}
          disabled={!canGoBack}
        />
        <Appbar.Action
          icon="arrow-right"
          onPress={() => goForward()}
          disabled={!canGoForward}
        />
        <Appbar.Action
          icon="refresh"
          onPress={() => refresh()}
          disabled={!webViewRef.current}
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
