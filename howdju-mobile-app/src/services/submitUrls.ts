import type { ShareDataItem } from "react-native-share-menu";
import logger from "@/logger";
import { makeUrl } from "./urls";

type ShareInfo = {
  url?: string;
  selectedText?: string;
  title?: string;
};

export function inferSubmitUrl(
  urlAuthority: string,
  items: ShareDataItem[]
): string {
  const safariShareInfo = inferShareInfo(items);
  return makeSubmitUrl(urlAuthority, safariShareInfo);
}

const inferShareInfo = (items: ShareDataItem[]): ShareInfo => {
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
          return valueObject as ShareInfo;
        }
        default:
        // fallthrough
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
          if (selectedText) {
            logger.warn({ title }, "title was already inferred");
          }
          selectedText = item.value;
          break;
      }
    }
  }

  return { url, title, selectedText };
};

const makeSubmitUrl = (urlAuthority: string, shareInfo: ShareInfo) => {
  const { url, selectedText, title } = shareInfo;
  const submitUrl = makeUrl(urlAuthority, "/media-excerpts/new");
  if (url) {
    submitUrl.searchParams.append("url", encodeURIComponent(url));
  }
  if (title) {
    submitUrl.searchParams.append("description", encodeURIComponent(title));
  }
  if (selectedText) {
    submitUrl.searchParams.append(
      "quotation",
      encodeURIComponent(selectedText)
    );
  }
  submitUrl.searchParams.append("source", "mobile-app");
  return submitUrl.href;
};
