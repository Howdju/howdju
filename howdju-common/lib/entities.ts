
/** A domain entity */
class Entity {}

/** An excerpt from a Source */
class SourceExcerpt extends Entity {}

/** A SourceExcerpt excerpting a quote from a written Source. */
export class WritQuote extends SourceExcerpt {
  quoteText: string
  title: string
  urls: Array<Url>
}

/** A uniform resource locator */
class Url {
  url: string
}
