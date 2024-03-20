import { JSDOM } from "jsdom";

import { Logger, toJson, utcNow, findTextInDoc } from "howdju-common";

import { MediaExcerptsService } from "./MediaExcerptsService";
import { UrlLocatorAutoConfirmationDao } from "../daos/UrlLocatorAutoConfirmationDao";
import { AsyncConfig, EntityNotFoundError } from "..";
import { generateTextFragmentUrlFromHtml } from "../requestMediaExcerptInfo";
import { fetchUrl } from "../fetchUrl";

export class UrlLocatorAutoConfirmationService {
  constructor(
    private readonly logger: Logger,
    private readonly asyncConfig: Promise<AsyncConfig>,
    private readonly mediaExcerptsService: MediaExcerptsService,
    private readonly urlLocatorAutoConfirmationDao: UrlLocatorAutoConfirmationDao
  ) {}

  public async confirmUrlLocator(urlLocatorId: string) {
    const urlLocator = await this.mediaExcerptsService.readUrlLocatorForId(
      urlLocatorId
    );
    if (!urlLocator) {
      throw new EntityNotFoundError("URL_LOCATOR", urlLocatorId);
    }
    const {
      url: { url },
      mediaExcerptId,
    } = urlLocator;
    const { quotation } =
      await this.mediaExcerptsService.readMediaExcerptLocalRepForId(
        mediaExcerptId
      );

    let html, errorMessage;
    try {
      html = await fetchUrl(url, this.asyncConfig);
    } catch (err) {
      if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = toJson(err);
      }
    }
    const confirmationResult = html
      ? confirmQuotationInHtml(url, html, quotation)
      : ({
          status: "ERROR",
          errorMessage,
        } as QuotationConfirmationResult);

    const result = {
      ...confirmationResult,
      urlLocatorId,
      url,
      quotation,
      completeAt: utcNow(),
    };
    this.logger.info(`Auto confirmation result: ${toJson(result)}`);
    await this.urlLocatorAutoConfirmationDao.create(result);

    const textFragmentUrl = html
      ? generateTextFragmentUrlFromHtml(url, html, quotation)
      : undefined;
    this.logger.info(`Inferred text fragment URL: ${textFragmentUrl}`);
    if (textFragmentUrl) {
      await this.mediaExcerptsService.updateTextFragmentUrlForUrlLocatorId(
        urlLocatorId,
        textFragmentUrl
      );
    }
  }
}

function confirmQuotationInHtml(
  url: string,
  html: string,
  quotation: string
): QuotationConfirmationResult {
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;
  const foundQuotation = findTextInDoc(doc, quotation);
  // TODO(491) add an APPROXIMATE_FOUND option if foundQuotation !== quotation.
  if (foundQuotation) {
    return {
      status: "FOUND",
      foundQuotation,
    };
  }
  return {
    status: "NOT_FOUND",
  };
}

type QuotationConfirmationResult =
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
