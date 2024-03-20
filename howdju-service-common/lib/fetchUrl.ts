import axios, { AxiosError, AxiosResponse } from "axios";
import { ZenRows } from "zenrows";
import queryString from "query-string";

import { isDefined, logger, newImpossibleError, toJson } from "howdju-common";
import { DownstreamServiceError } from "./serviceErrors";
import {
  AsyncConfig,
  ZEN_ROWS_API_KEY,
  SCRAPING_ANT_API_KEY,
} from "./initializers";

const DIRECT_REQUEST_TIMEOUT = 3000;
const ZEN_ROWS_REQUEST_TIMEOUT = 5000;
const SCRAPING_ANT_REQUEST_TIMEOUT = 15_000;

export interface FetchUrlResult {
  status: "SUCCESS" | "PARTIAL_SUCCESS" | "FAILURE";
}

export async function fetchUrl(
  url: string,
  asyncConfig: Promise<AsyncConfig>
): Promise<string>;
export async function fetchUrl<R extends FetchUrlResult>(
  url: string,
  asyncConfig: Promise<AsyncConfig>,
  test: (html: string) => R
): Promise<R>;
export async function fetchUrl<R extends FetchUrlResult>(
  url: string,
  asyncConfig: Promise<AsyncConfig>,
  test?: (html: string) => R
): Promise<R | string> {
  logger.info(`Requesting URL directly: ${url}`);

  let directTestResult: R | undefined = undefined;

  const directFetchResult = await fetchUrlDirectly(url);
  if (
    "html" in directFetchResult &&
    (!test ||
      (directTestResult = test(directFetchResult.html)).status === "SUCCESS")
  ) {
    logger.info(`Requesting URL directly succeeded: ${url}`);
    return directTestResult || directFetchResult.html;
  }

  if ("error" in directFetchResult) {
    logger.info(
      `Requesting URL directly failed. ${toJson({
        url,
        error: directFetchResult.error,
      })}`
    );
  } else {
    logger.info(
      `Requesting URL directly failed the test. ${toJson({
        url,
      })}`
    );
  }

  let scrapingAntFetchResult: FetchResult | undefined = undefined;
  let scrapingAntTestResult: R | undefined = undefined;

  const config = await asyncConfig;
  if (!config[SCRAPING_ANT_API_KEY]) {
    logger.info(
      "ScrapingAnt API key is missing so we cannot retry the request."
    );
  } else {
    scrapingAntFetchResult = await fetchUrlWithScrapingAnt(
      url,
      config[SCRAPING_ANT_API_KEY]
    );
    if (
      "html" in scrapingAntFetchResult &&
      (!test ||
        (scrapingAntTestResult = test(scrapingAntFetchResult.html)).status ===
          "SUCCESS")
    ) {
      logger.info(`Requesting URL via ScrapingAnt succeeded: ${url}`);
      return scrapingAntTestResult || scrapingAntFetchResult.html;
    }

    if ("error" in scrapingAntFetchResult) {
      logger.info(
        `Requesting URL via ScrapingAnt failed. ${toJson({
          url,
          error: scrapingAntFetchResult.error,
        })}`
      );
    } else {
      logger.info(
        `Requesting URL via ScrapingAnt failed the test. ${toJson({
          url,
        })}`
      );
    }
  }

  let zenRowsFetchResult: FetchResult | undefined = undefined;
  let zenRowsTestResult: R | undefined = undefined;

  if (!config[ZEN_ROWS_API_KEY]) {
    logger.info("ZenRows API key is missing so we cannot retry the request.");
  } else {
    zenRowsFetchResult = await fetchUrlWithZenRows(
      url,
      config[ZEN_ROWS_API_KEY]
    );
    if (
      "html" in zenRowsFetchResult &&
      (!test ||
        (zenRowsTestResult = test(zenRowsFetchResult.html)).status ===
          "SUCCESS")
    ) {
      logger.info(`Requesting URL ZenRows succeeded: ${url}`);
      return zenRowsTestResult || zenRowsFetchResult.html;
    }

    if ("error" in zenRowsFetchResult) {
      logger.info(
        `Requesting URL via ZenRows failed. ${toJson({
          url,
          error: zenRowsFetchResult.error,
        })}`
      );
    } else {
      logger.info(
        `Requesting URL via ZenRows failed the test. ${toJson({
          url,
        })}`
      );
    }
  }

  // If no strategies got success, then try to return a partial success
  const testResults = [
    directTestResult,
    scrapingAntTestResult,
    zenRowsTestResult,
  ]
    .filter(isDefined)
    .sort((s1, s2) => {
      if (s1.status === "PARTIAL_SUCCESS" && s2.status === "FAILURE") {
        return -1;
      }
      if (s1.status === "FAILURE" && s2.status === "PARTIAL_SUCCESS") {
        return 1;
      }
      return 0;
    });
  if (testResults.length) {
    const result = testResults[0];
    return result;
  }
  const errorFetchResults = [
    directFetchResult,
    scrapingAntFetchResult,
    zenRowsFetchResult,
  ].filter((r): r is { error: AxiosError } => !!r && "error" in r);
  if (errorFetchResults.length) {
    throw new DownstreamServiceError(
      `All strategies for fetching URL failed: ${url}`,
      errorFetchResults[0].error
    );
  }
  throw newImpossibleError(
    `Fetch had no fetch failures and no test failures, but didn't return.`
  );
}

type FetchResult = { html: string } | { error: AxiosError };

export async function fetchUrlDirectly(url: string): Promise<FetchResult> {
  try {
    const response = await axios.get(url, {
      timeout: DIRECT_REQUEST_TIMEOUT,
    });
    logger.info(`Requesting URL directly succeeded: ${url}`);
    return { html: response.data };
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    return { error };
  }
}

export async function fetchUrlWithScrapingAnt(url: string, apiKey: string) {
  const stringifiedQueryString = queryString.stringify({
    url,
    "x-api-key": apiKey,
    return_page_source: true,
  });
  const scrapingAntUrl = new URL(
    `https://api.scrapingant.com/v2/general?${stringifiedQueryString}`
  ).toString();
  try {
    const response = await axios.get(scrapingAntUrl, {
      timeout: SCRAPING_ANT_REQUEST_TIMEOUT,
      headers: {
        useQueryString: true,
      },
    });
    logger.info(`Requesting URL with ScrapingAnt succeeded: ${url}`);
    return { html: response.data };
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    return { error };
  }
}

export async function fetchUrlWithZenRows(
  url: string,
  zenRowsApiKey: string
): Promise<FetchResult> {
  const controller = new AbortController();
  try {
    const client = new ZenRows(zenRowsApiKey);
    const { data } = (await Promise.race([
      client.get(url, {
        signal: controller.signal,
      }),
      new Promise((_resolve, reject) =>
        setTimeout(() => {
          controller.abort();
          reject(new Error("ZenRows request timed out"));
        }, ZEN_ROWS_REQUEST_TIMEOUT)
      ),
    ])) as AxiosResponse;
    return { html: data };
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }
    return { error };
  }
}
