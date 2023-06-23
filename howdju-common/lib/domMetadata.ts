import moment from "moment";

import { isDefined } from "./general";

export function getMediaExcerptInfo(doc: Document): MediaExcerptInfo {
  const sourceDescription = getSourceDescription(doc);
  const authors = getAuthors(doc);
  return { sourceDescription, authors };
}

function getSourceDescription(doc: Document) {
  for (const { test, transform } of sourceDescriptionFinders) {
    if (!test(doc)) {
      continue;
    }
    const sourceDescription = transform(doc);
    if (sourceDescription) {
      return sourceDescription;
    }
  }
  return doc.title;
}

function getAuthors(doc: Document) {
  for (const { selector, transform } of authorFinders) {
    const els = doc.querySelectorAll(selector);
    if (els.length) {
      const authors = Array.from(els).map(transform).filter(isDefined);
      if (authors.length) {
        return authors;
      }
    }
  }
  return undefined;
}

interface MediaExcerptInfo {
  sourceDescription: string;
  pincite?: string;
  authors?: string[];
}

interface TestTransform {
  test: (doc: Document) => boolean;
  transform: (doc: Document) => string | undefined;
}

const sourceDescriptionFinders: TestTransform[] = [
  {
    // https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1280342/
    test: (doc: Document) => !!doc.querySelector('meta[name="citation_title"]'),
    transform: (doc: Document) => {
      const journal = doc
        .querySelector('meta[name="citation_journal_title"]')
        ?.getAttribute("content");
      const title = doc
        .querySelector('meta[name="citation_title"]')
        ?.getAttribute("content");
      const rawPublicationDate = doc
        .querySelector('meta[name="citation_publication_date"]')
        ?.getAttribute("content")
        ?.replace("/", "-");
      const volume = doc
        .querySelector('meta[name="citation_volume"]')
        ?.getAttribute("content");
      const issue = doc
        .querySelector('meta[name="citation_issue"]')
        ?.getAttribute("content");
      const citationFirstpage = doc
        .querySelector('meta[name="citation_firstpage"]')
        ?.getAttribute("content");
      const doi = doc
        .querySelector('meta[name="citation_doi"]')
        ?.getAttribute("content");
      const issuePart = issue ? `,${issue}` : "";
      const volumePart = volume ? `vol. ${volume}${issuePart}` : "";
      const pagePart = citationFirstpage ? `: ${citationFirstpage}` : "";
      const publicationDate = moment(rawPublicationDate).format("YYYY");
      const datePart = publicationDate ? ` (${publicationDate})` : "";
      const sourceDescription = `“${title}” ${journal} ${volumePart}${datePart}${pagePart}. doi:${doi}`;
      return sourceDescription.replace(/\s+/, " ").trim();
    },
  },
  {
    // https://www.nytimes.com/live/2023/06/24/world/russia-ukraine-news
    test: (doc: Document) =>
      Array.from(
        doc.querySelectorAll('script[type="application/ld+json"]')
      ).some(
        (el) => JSON.parse(el.textContent ?? "")?.["@type"] === "NewsArticle"
      ),
    transform: (doc: Document) => {
      const lds = Array.from(
        doc.querySelectorAll('script[type="application/ld+json"]')
      )
        .map((el) => JSON.parse(el.textContent ?? "null"))
        .filter((json) => !!json);
      const articleLd = lds.find((ld) => ld["@type"] === "NewsArticle");
      const organizationLd = lds.find(
        (ld) => ld["@type"] === "NewsMediaOrganization"
      );
      if (!articleLd) {
        return undefined;
      }

      const publisher = articleLd.publisher?.name || organizationLd?.name;
      const title =
        articleLd.headline ||
        doc
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content") ||
        doc.title;

      const rawDate =
        articleLd.datePublished ||
        doc
          .querySelector('meta[property="article:published_time"]')
          ?.getAttribute("content") ||
        doc.querySelector('meta[name="pdate"]')?.getAttribute("content");
      const datePublished = moment(rawDate).format("YYYY-MM-DD");

      const publisherPart = publisher ? ` ${publisher}` : "";
      const datePart = datePublished ? ` (${datePublished})` : "";
      const sourceDescription = `“${title}”${publisherPart}${datePart}`;
      return sourceDescription.replace(/\s+/, " ").trim();
    },
  },
];

interface SelectorTransform {
  selector: string;
  transform: (el: Element) => string | undefined;
}

const authorFinders: SelectorTransform[] = [
  {
    // https://html.spec.whatwg.org/multipage/links.html#link-type-author
    // NPR: https://www.npr.org/2023/06/22/1183653543/titan-submersible-missing-adventure-tourism-rescue-risk-cost
    selector: 'a[rel="author"]',
    transform: (el) => el.textContent ?? undefined,
  },
  {
    // https://html.spec.whatwg.org/multipage/semantics.html#the-author-element
    // Pubmed: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1280342/
    selector: 'meta[name="citation_author"]',
    transform: (el) => el.getAttribute("content") ?? undefined,
  },
  {
    // https://www.nytimes.com/live/2023/06/24/world/russia-ukraine-news
    selector: 'meta[name="byl"]',
    transform: (el) =>
      el.getAttribute("content")?.replace(/^by /i, "") ?? undefined,
  },
];
