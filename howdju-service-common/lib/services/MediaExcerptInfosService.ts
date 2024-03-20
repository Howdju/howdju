import { MediaExcerptInfo, normalizeUrl } from "howdju-common";
import { AsyncConfig } from "..";

import { MediaExcerptsDao } from "../daos";
import { requestMediaExcerptInfo } from "../requestMediaExcerptInfo";

export class MediaExcerptInfosService {
  constructor(
    private readonly asyncConfig: Promise<AsyncConfig>,
    private readonly mediaExcerptsDao: MediaExcerptsDao
  ) {}

  async inferMediaExcerptInfo(
    url: string,
    quotation: string | undefined
  ): Promise<MediaExcerptInfo> {
    const mediaExcerptInfo = await requestMediaExcerptInfo(
      url,
      this.asyncConfig,
      quotation
    );
    const normalUrl = normalizeUrl(url);
    const sourceDescriptions =
      await this.mediaExcerptsDao.readPopularSourceDescriptions(normalUrl);
    if (!sourceDescriptions.length) {
      return mediaExcerptInfo;
    }
    return {
      ...mediaExcerptInfo,
      sourceDescription: sourceDescriptions[0],
    };
  }
}
