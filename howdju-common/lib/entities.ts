
/** A SourceExcerpt excerpting a quote from a written Source. */
export interface WritQuote {
  quoteText: string
  writ: {
    title: string
  }
  urls: Array<Url>
}

/** A uniform resource locator */
export class Url {
  url: string

  constructor(url: string) {
    this.url = url;
  }
}
