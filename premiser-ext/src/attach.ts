import { Extension } from "howdju-client-common";

export function attachHeadersListener({
  ext,
  hosts,
  iframeHosts,
  overrideFrameOptions,
  isDevelopment,
}: {
  ext: Extension;
  hosts: string | string[];
  iframeHosts: string | string[];
  overrideFrameOptions: boolean;
  isDevelopment: boolean;
}) {
  if (typeof hosts !== "string") {
    if (hosts) {
      hosts = hosts.join(" ");
    } else {
      throw new Error("`hosts` option must be a string or array");
    }
  }

  if (typeof iframeHosts !== "string") {
    if (iframeHosts) {
      iframeHosts = iframeHosts.join(" ");
    } else {
      throw new Error("`iframeHosts` option must be a string or array");
    }
  }

  const types: chrome.webRequest.ResourceType[] = ["main_frame"];

  if (overrideFrameOptions) {
    types.push("sub_frame");
  }

  ext.addWebRequestOnHeadersReceivedListener(
    (details) => {
      const responseHeaders = details.responseHeaders?.map((header) =>
        modifyHeader(
          header,
          hosts,
          iframeHosts,
          overrideFrameOptions,
          isDevelopment
        )
      );
      return { responseHeaders };
    },
    {
      urls: ["http://*/*", "https://*/*"],
      types,
    },
    ["blocking", "responseHeaders"]
  );
}

function modifyHeader(
  header: chrome.webRequest.HttpHeader,
  hosts: string | string[],
  iframeHosts: string | string[],
  overrideFrameOptions: boolean,
  isDevelopment: boolean
) {
  const isCSPHeader = /content-security-policy/i.test(header.name);
  const isFrameHeader = /x-frame-options/i.test(header.name);

  if (isCSPHeader) {
    let csp = header.value;

    csp = csp?.replace("script-src", `script-src ${hosts}`);
    csp = csp?.replace("style-src", `style-src ${hosts}`);
    csp = csp?.replace("frame-src", `frame-src ${iframeHosts}`);
    csp = csp?.replace("child-src", `child-src ${hosts}`);
    if (isDevelopment) {
      csp = csp?.replace("block-all-mixed-content;", "");
      csp = csp?.replace("upgrade-insecure-requests;", "");
    }

    if (overrideFrameOptions) {
      csp = csp?.replace(/frame-ancestors (.*?);/gi, "");
    }

    header.value = csp;
  } else if (isFrameHeader && overrideFrameOptions) {
    header.value = "ALLOWALL";
  }

  return header;
}
