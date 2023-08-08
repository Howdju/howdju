import {
  Logger,
  QuotationConfirmationResult,
  toJson,
  utcNow,
} from "howdju-common";

import { MediaExcerptsService } from "./MediaExcerptsService";
import { UrlLocatorAutoConfirmationDao } from "../daos/UrlLocatorAutoConfirmationDao";
import { EntityNotFoundError } from "..";
import {
  confirmQuotationInHtml,
  generateTextFragmentUrlFromHtml,
} from "../requestMediaExcerptInfo";
import { fetchUrl } from "../fetchUrl";

export class UrlLocatorAutoConfirmationService {
  constructor(
    private readonly logger: Logger,
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
      html = await fetchUrl(url);
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
