import ShareDataItem from 'models/ShareDataItem';
import React from 'react';

import { WebView } from 'react-native-webview';

const makeUrl = (url: string, selectedText: string, title: string) => {
  const submitUrl = new URL(`https://www.howdju.com/submit`)
  submitUrl.searchParams.append("url", url)
  if (title) {
    submitUrl.searchParams.append("description", encodeURIComponent(title))
  }
  if (selectedText) {
    submitUrl.searchParams.append("quoteText", encodeURIComponent(selectedText))
  }
  submitUrl.searchParams.append("source", "mobile-app")
  return submitUrl.href
}

type SafariShareInfo = {
  url: string,
  selectedText?: string,
  title?: string,
}

const BrowserScreen: React.FC<{
  items: ShareDataItem[]
}> = ({items}) => {
  let safariShareInfo = null
  if (items) {
    for (let item of items) {
      if (item.mimeType === "text/json") {
        const valueObject = JSON.parse(item.value)
        safariShareInfo = valueObject
        break
      }
    }
  }

  let browserUrl
  if (safariShareInfo) {
    const {url: shareUrl, selectedText, title} = safariShareInfo
    browserUrl = makeUrl(shareUrl, selectedText, title)
  } else {
    browserUrl = "https://howdju.com/recent-activity/"
  }
  console.log({browserUrl})
  return (
    <WebView
      source={{uri: browserUrl}}
      style={{marginTop: 20}}
      onError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.error('WebView error: ', nativeEvent);
      }}
      onHttpError={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn(
          'WebView HTTP error: ',
          nativeEvent.statusCode,
        );
      }}
      onRenderProcessGone={syntheticEvent => {
        const { nativeEvent } = syntheticEvent;
        console.warn(
          'WebView Crashed: ',
          nativeEvent.didCrash,
        );
      }}
      onContentProcessDidTerminate={(syntheticEvent) => {
        const { nativeEvent } = syntheticEvent;
        console.warn('Content process terminated, reloading', nativeEvent);
        this.refs.webview.reload();
      }}
    />
  )
}

export default BrowserScreen
