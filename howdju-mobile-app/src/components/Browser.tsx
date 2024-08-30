import React, { useCallback, useEffect, useRef, useState } from "react";
import { WebView, WebViewProps } from "react-native-webview";
import { Alert, Share, StyleSheet, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  ProgressBar,
  TextInput,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { toJson } from "howdju-common";

import logger from "@/logger";

const UPDATE_STATE_AFTER_CANCEL = "UPDATE_STATE_AFTER_CANCEL";

// This message helps the browser to correct its state after the user cancels
// an in-progress load.
type UpdateStateAfterCancelMessage = {
  messageType: typeof UPDATE_STATE_AFTER_CANCEL;
  url: string;
  historyState?: { canGoBack: boolean; canGoForward: boolean };
};
type Message = UpdateStateAfterCancel;

interface BrowserProps extends WebViewProps {
  url: string | undefined;
  onUrlChange?: (url: string) => void;
}

/**
 * A browser component that wraps a WebView and provides the following controls:
 *
 * - an editable URL bar
 * - Backward, forward, and refresh buttons
 * - Share URL button
 */
export function Browser({
  url,
  onUrlChange,
  onNavigationStateChange,
  onLoadStart,
  onLoadProgress,
  onLoadEnd,
  onMessage,
  onContentProcessDidTerminate,
  ...rest
}: BrowserProps) {
  const webViewRef = useRef<WebView | null>(null);

  const insets = useSafeAreaInsets();
  const safeArea = {
    paddingTop: insets.top,
    // bottom is handled by the parent container.
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  // Whether the WebView is currently loading a page. Determines whether to show
  // the progress bar.
  const [isLoading, setIsLoading] = useState(true);
  // The progress of the current page load, from 0 to 1.
  const [loadProgress, setLoadProgress] = useState(0);
  // These three states help infer whether a user can go back from a canceled
  // load.
  const [goingBack, setGoingBack] = useState(false);
  const [goingForward, setGoingForward] = useState(false);
  const [isClicking, setIsClicking] = useState(false);

  // Whether the user can go back or forward. Control the disabled states of the
  // back/forward buttons.
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  // The URL that the WebView is currently displaying.
  const [webViewUrl, setWebViewUrl] = useState(undefined as string | undefined);
  // The URL that URL text input is showing.
  const [inputUrl, setInputUrl] = useState(undefined as string | undefined);

  /** Set the URL the Browser considers to be active. */
  const setBrowserUrl = useCallback(
    (url: string) => {
      setInputUrl(url);
      if (onUrlChange) {
        onUrlChange(url);
      }
    },
    [setInputUrl, onUrlChange]
  );

  /** Set both the WebView and  */
  const setBothUrls = useCallback(
    (url: string) => {
      setWebViewUrl(url);
      setInputUrl(url);
    },
    [setWebViewUrl]
  );

  useEffect(() => {
    if (url && url !== inputUrl) {
      setBothUrls(url);
    }
  }, [url, inputUrl, setBothUrls]);

  function goBackward() {
    webViewRef.current?.goBack();
  }

  function goForward() {
    webViewRef.current?.goForward();
  }

  function refresh() {
    webViewRef.current?.reload();
  }

  /**
   * Injects JavaScript into the WebView.
   *
   * JavaScript is wrapped in an IIFE to prevent it from leaking into the
   * global scope. If a message type is provided, a message will be posted to
   * the window after the script is executed.
   */
  function injectJavaScript(
    script: string,
    messageType?: string,
    messageFields: string[] = []
  ) {
    logger.debug("injectJavaScript", script);
    if (!webViewRef.current) {
      logger.error(
        "Unable to inject JavaScript because the WebView is missing."
      );
      return;
    }

    if (!script.trimEnd().endsWith(";")) {
      script = script.trimEnd() + ";";
    }
    const postMessageScript = messageType
      ? `window.ReactNativeWebView.postMessage(JSON.stringify({
          messageType: ${JSON.stringify(messageType)},
          ${messageFields.join(",")}
        }));`
      : "";
    const iifeScript = `
      (() => {
        ${script}
        ${postMessageScript}
      })();
      true;
    `;

    logger.debug("injecting JavaScript", iifeScript);
    webViewRef.current.injectJavaScript(iifeScript);
  }

  function reloadStateFromWebView() {
    injectJavaScript(
      `
      const url = window.location.href;
      const historyState = getHistoryState();
      function getHistoryState() {
        if (window.navigation && "canGoForward" in window.navigation) {
          // Chrome
          return {
            canGoBack: window.navigation.canGoBack,
            canGoForward: window.navigation.canGoForward
          };
        } else {
         return undefined;
        }
      }`,
      UPDATE_STATE_AFTER_CANCEL,
      ["url", "historyState"]
    );
  }

  function setGoingForwardNotBackward() {
    setGoingForward(true);
    setGoingBack(false);
  }

  function setGoingBackwardNotForwardward() {
    setGoingForward(false);
    setGoingBack(true);
  }

  function handleMessage(message: Message) {
    logger.debug(`handleMessage: ${toJson(message)}`);
    switch (message.messageType) {
      case UPDATE_STATE_AFTER_CANCEL:
        updateStateAfterCancel(message);
        break;
      default:
        logger.error(
          `Unknown message type "${message.messageType}": ${message}`
        );
    }
  }

  /**
   * Corrects the URL and attempts to correct canGoForward/canGoBack after the
   * user cancels an in-progress load.
   */
  function updateStateAfterCancel(message: UpdateStateAfterCancelMessage) {
    if (message.historyState) {
      // If the browser was able to provide history state, use it because
      // it is probably more reliable than our own tracking.
      setCanGoBack(message.historyState.canGoBack);
      setCanGoForward(message.historyState.canGoForward);
    } else {
      // The inputUrl updates immediately to the new URL. If message.url is
      // equal to it, then the navigation got far enough to at least partially
      // load the page.

      // Use startsWith in case inputUrl has a text fragment which won't be
      // visible on the page.
      if (inputUrl?.startsWith(message.url)) {
        if (goingBack) {
          // If we were going back and partially succeeded, we can go forward
          setCanGoForward(true);
        } else if (goingForward) {
          // If we were going forward and partially succeeded, we can go back.
          setCanGoBack(true);
          if (isClicking) {
            // And if we were clicking, there can't be anything forward.
            setCanGoForward(false);
          }
        }
      }
    }
    // Always update the display URL to match the actual page's URL.
    setBrowserUrl(message.url);
  }

  function cancel() {
    webViewRef.current?.stopLoading();
    // If we cancel a load, the only way to know for sure which URL the WebView
    // is displaying is to ask it. We will also try to update the forward/back
    // state.
    reloadStateFromWebView();
    endLoading();
  }

  async function shareBrowserUrl() {
    if (!webViewUrl) {
      logger.warn("Cannot share current URL because it is missing.");
      return;
    }
    try {
      const result = await Share.share({
        message: webViewUrl,
      });
      logger.log({ shareResult: result });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  }

  function submitDisplayUrl(url: string) {
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }
    setBothUrls(url);
  }

  function startLoading() {
    setIsLoading(true);
    setLoadProgress(0);
  }

  function endLoading() {
    setIsLoading(false);
    setLoadProgress(100);
  }

  // Don't display the webview until we have a currentUrl because it requires a
  // valid URL to render and if we pass a placeholder it can enter an infinite
  // loop as the callbacks interfere with each other.
  const webView = !webViewUrl ? null : (
    <WebView
      ref={(wv) => {
        webViewRef.current = wv;
      }}
      source={{ uri: webViewUrl }}
      allowsBackForwardNavigationGestures={true}
      onNavigationStateChange={(navState) => {
        if (onNavigationStateChange) {
          onNavigationStateChange(navState);
        }
        setCanGoBack(navState.canGoBack);
        setCanGoForward(navState.canGoForward);
        setBrowserUrl(navState.url);
        if (navState.navigationType === "click") {
          setGoingForwardNotBackward();
          setIsClicking(true);
        }
      }}
      onLoadStart={(event) => {
        if (onLoadStart) {
          onLoadStart(event);
        }
        const { nativeEvent } = event;
        startLoading();
        if (nativeEvent.navigationType === "click") {
          setGoingForwardNotBackward();
          setIsClicking(true);
        }
      }}
      onLoadProgress={(event) => {
        if (onLoadProgress) {
          onLoadProgress(event);
        }
        const {
          nativeEvent: { progress },
        } = event;
        if (progress === 1) {
          endLoading();
        } else {
          setLoadProgress(progress);
        }
      }}
      onLoadEnd={(event) => {
        if (onLoadEnd) {
          onLoadEnd(event);
        }
        const { nativeEvent } = event;
        endLoading();
        // When a page finishes loading, ensure the display URL reflects what
        // the WebView is showing.
        setBrowserUrl(nativeEvent.url);
      }}
      onMessage={(event) => {
        if (onMessage) {
          onMessage(event);
        }
        const {
          nativeEvent: { data },
        } = event;
        const message = JSON.parse(data);
        handleMessage(message);
      }}
      onContentProcessDidTerminate={(event) => {
        if (onContentProcessDidTerminate) {
          onContentProcessDidTerminate(event);
        }
        const { nativeEvent } = event;
        if (!webViewRef.current) {
          logger.error(
            "Unable to reload webview because it is missing.",
            toJson(nativeEvent)
          );
          return;
        }
        webViewRef.current.reload();
      }}
      {...rest}
    />
  );
  const activityIndicator = (
    <View style={styles.activityContainer}>
      <ActivityIndicator size="large" animating={true} />
    </View>
  );
  return (
    <View style={[styles.container, safeArea]}>
      {webView || activityIndicator}
      {isLoading && <ProgressBar progress={loadProgress} />}
      <TextInput
        value={inputUrl}
        onChangeText={setInputUrl}
        onSubmitEditing={({ nativeEvent: { text } }) => submitDisplayUrl(text)}
        accessibilityLabel="Current URL"
        autoCorrect={false}
        autoCapitalize="none"
        clearButtonMode="while-editing"
        keyboardType="url"
        returnKeyType="go"
        placeholder="Enter URL"
        placeholderTextColor={"#666"}
      />
      <Appbar style={{ justifyContent: "space-evenly" }}>
        <Appbar.Action
          icon="arrow-left"
          onPress={() => {
            setGoingBackwardNotForwardward();
            goBackward();
          }}
          disabled={!canGoBack}
          accessibilityLabel="Browser go back"
        />
        <Appbar.Action
          icon="arrow-right"
          onPress={() => {
            setGoingForwardNotBackward();
            goForward();
          }}
          disabled={!canGoForward}
          accessibilityLabel="Browser go forward"
        />
        {isLoading ? (
          <Appbar.Action
            icon="close"
            onPress={() => cancel()}
            accessibilityLabel="Cancel browser load"
          />
        ) : (
          <Appbar.Action
            icon="refresh"
            onPress={() => refresh()}
            accessibilityLabel="Refresh browser"
          />
        )}
        <Appbar.Action
          icon="share"
          disabled={!webViewUrl}
          onPress={() => void shareBrowserUrl()}
        />
      </Appbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  activityContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default Browser;
