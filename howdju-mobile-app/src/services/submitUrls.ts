import type { ShareDataItem } from "react-native-share-menu";
import logger from "@/logger";

type SafariShareInfo = {
  url?: string;
  selectedText?: string;
  title?: string;
};

export function inferSubmitUrl(items: ShareDataItem[]): string {
  const safariShareInfo = inferSafariShareInfo(items);
  return makeSubmitUrl(safariShareInfo);
}

const inferSafariShareInfo = (items: ShareDataItem[]): SafariShareInfo => {
  let url;
  let selectedText;
  let title;
  if (items) {
    for (const item of items) {
      // If we ever find a Javascript preprocessing result, use it.
      switch (item.role) {
        case "provider/data/javascript-preprocessing":
        case "provider/property-list/javascript-preprocessing": {
          const valueObject = JSON.parse(item.value);
          return valueObject as SafariShareInfo;
        }
      }

      // Otherwise try to infer the share info from other items.
      switch (item.mimeType) {
        case "text/uri-list":
          if (url) {
            logger.warn({ url }, "URL was already inferred");
          }
          url = item.value;
          break;
        case "text/plain":
          if (title) {
            logger.warn({ title }, "title was already inferred");
          }
          title = item.value;
          break;
      }
    }
  }

  return { url, title, selectedText };
};

const makeSubmitUrl = (safariShareInfo: SafariShareInfo) => {
  const { url, selectedText, title } = safariShareInfo;
  const submitUrl = new URL("https://www.howdju.com/submit");
  if (url) {
    submitUrl.searchParams.append("url", url);
  }
  if (title) {
    submitUrl.searchParams.append("description", encodeURIComponent(title));
  }
  if (selectedText) {
    submitUrl.searchParams.append(
      "quoteText",
      encodeURIComponent(selectedText)
    );
  }
  submitUrl.searchParams.append("source", "mobile-app");
  return submitUrl.href;
};
