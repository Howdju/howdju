import React from 'react';
import {WebView} from 'react-native-webview';
import type {ShareDataItem} from 'react-native-share-menu';

import {inferSubmitUrl} from '@/services/submitUrls';
import {StyleSheet} from 'react-native';

class BrowserScreen extends React.Component<{
  items: ShareDataItem[];
}> {
  render = () => {
    const {items} = this.props;
    const submitUrl = inferSubmitUrl(items);
    const browserUrl = submitUrl ?? 'https://howdju.com/recent-activity/';
    return (
      <WebView
        source={{uri: browserUrl}}
        style={styles.webView}
        onError={syntheticEvent => {
          const {nativeEvent} = syntheticEvent;
          console.error('WebView error: ', nativeEvent);
        }}
        onHttpError={syntheticEvent => {
          const {nativeEvent} = syntheticEvent;
          console.warn('WebView HTTP error: ', nativeEvent.statusCode);
        }}
        onRenderProcessGone={syntheticEvent => {
          const {nativeEvent} = syntheticEvent;
          console.warn('WebView Crashed: ', nativeEvent.didCrash);
        }}
        onContentProcessDidTerminate={syntheticEvent => {
          const {nativeEvent} = syntheticEvent;
          console.warn('Content process terminated, reloading', nativeEvent);
          (this.refs.webview as WebView).reload();
        }}
      />
    );
  };
}

const styles = StyleSheet.create({
  webView: {
    marginTop: 20,
  },
});

export default BrowserScreen;
