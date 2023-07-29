import { JSDOM } from "jsdom";
import * as textQuote from "dom-anchor-text-quote";

import { toJson, utcNow } from "howdju-common";

import { fetchUrl } from "../fetchUrl";
import { MediaExcerptsService } from "./MediaExcerptsService";
import {
  UrlLocatorAutoConfirmationDao,
  UrlLocatorAutoConfirmationResult,
} from "../daos/UrlLocatorAutoConfirmationDao";

export class UrlLocatorAutoConfirmationService {
  constructor(
    private readonly mediaExcerptsService: MediaExcerptsService,
    private readonly urlLocatorAutoConfirmationDao: UrlLocatorAutoConfirmationDao
  ) {}

  public async confirmUrlLocator(
    urlLocatorId: string
  ): Promise<UrlLocatorAutoConfirmationResult> {
    const {
      url: { url },
      mediaExcerptId,
    } = await this.mediaExcerptsService.readUrlLocatorForId(urlLocatorId);
    const { quotation } =
      await this.mediaExcerptsService.readMediaExcerptLocalRepForId(
        mediaExcerptId
      );

    const confirmationResult = await confirmQuotation(url, quotation);

    const result = {
      ...confirmationResult,
      urlLocatorId,
      url,
      quotation,
      completeAt: utcNow(),
    };
    return await this.urlLocatorAutoConfirmationDao.create(result);
  }
}

type ConfirmationResult =
  | {
      status: "NOT_FOUND";
      foundQuotation?: undefined;
      errorMessage?: undefined;
    }
  | {
      status: "FOUND";
      foundQuotation: string;
      errorMessage?: undefined;
    }
  | {
      status: "ERROR";
      foundQuotation?: undefined;
      errorMessage: string;
    };

async function confirmQuotation(
  url: string,
  quotation: string
): Promise<ConfirmationResult> {
  let html;
  try {
    html = await fetchUrl(url);
  } catch (err) {
    if (err instanceof Error) {
      return {
        status: "ERROR",
        errorMessage: err.message,
      };
    }
    return {
      status: "ERROR",
      errorMessage: toJson(err),
    };
  }
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  const quotationRange = textQuote.toRange(doc.body, {
    exact: quotation,
  });
  if (!quotationRange) {
    return {
      status: "NOT_FOUND",
    };
  }
  return {
    status: "FOUND",
    foundQuotation: quotationRange.toString(),
  };
}
