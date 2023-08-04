import { JSDOM } from "jsdom";

import { utcNow } from "howdju-common";

import { CanonicalUrlsDao } from "../daos";
import { fetchUrl } from "../fetchUrl";

export class CanonicalUrlsService {
  constructor(private readonly canonicalUrlsDao: CanonicalUrlsDao) {}

  async readOrFetchCanonicalUrl(url: string) {
    const oldCanonicalUrl = await this.canonicalUrlsDao.read(url);
    if (oldCanonicalUrl) {
      return oldCanonicalUrl;
    }

    const html = await fetchUrl(url);
    const dom = new JSDOM(html, { url });
    const canonicalUrl =
      dom.window.document
        .querySelector("link[rel=canonical]")
        ?.getAttribute("href") || undefined;

    await this.canonicalUrlsDao.create(url, canonicalUrl, utcNow());

    return canonicalUrl;
  }
}
