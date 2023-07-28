import axios, { AxiosResponse } from "axios";
import { ZenRows } from "zenrows";

import { logger, toJson } from "howdju-common";
import { DownstreamServiceError } from "./serviceErrors";

const DIRECT_REQUEST_TIMEOUT = 3000;
const ZEN_ROWS_REQUEST_TIMEOUT = 5000;

export async function getHtml(url: string): Promise<string> {
  logger.info(`Requesting URL directly: ${url}`);
  try {
    const response = await axios.get(url, {
      timeout: DIRECT_REQUEST_TIMEOUT,
    });
    logger.info(`Requesting URL directly succeeded: ${url}`);
    return response.data;
  } catch (error) {
    if (!axios.isAxiosError(error)) {
      throw error;
    }

    if (!process.env.ZEN_ROWS_API_KEY) {
      logger.info("ZenRows API key is missing so we cannot retry the request.");
      throw new DownstreamServiceError(`Failed to fetch URL: ${url}`, error);
    }
    logger.info(
      `Requesting URL directly failed, retrying with ZenRows. ${toJson({
        url,
        error,
      })}`
    );

    const controller = new AbortController();
    try {
      const client = new ZenRows(process.env.ZEN_ROWS_API_KEY);
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
      logger.info(`Requesting URL with ZenRows succeeded: ${url}`);
      return data;
    } catch (error) {
      if (!axios.isAxiosError(error)) {
        throw error;
      }
      throw new DownstreamServiceError(`Failed to fetch URL: ${url}`, error);
    }
  }
}
