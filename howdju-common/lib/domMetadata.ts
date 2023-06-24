import { isString } from "lodash";
import moment from "moment";
import type { Article, NewsArticle } from "schema-dts";
import { isDefined } from "./general";

import { CreatePersorgInput } from "./zodSchemas";

type NewsArticleAuthor = NonNullable<NewsArticle["author"]>;

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
  return descriptionizeTitle(doc);
}

function descriptionizeTitle(doc: Document) {
  let lastSeparator;
  // It's a common pattern to have a title like "The Title - The Publication"
  const lastHypen = doc.title.lastIndexOf(" - ");
  if (lastHypen !== -1) {
    lastSeparator = lastHypen;
  }
  const lastVerticalBar = doc.title.lastIndexOf(" | ");
  if (lastVerticalBar !== -1) {
    lastSeparator = lastVerticalBar;
  }
  if (lastSeparator) {
    const { sourceTitle, sourcePublication } = extractFromSeparator(
      doc.title,
      lastSeparator
    );
    const date = extractDate(doc);
    const datePart = date ? ` (${date})` : "";
    return `“${sourceTitle}” ${sourcePublication}${datePart}`;
  }
  return doc.title;
}

export function extractDate(doc: Document) {
  const publishedRaw = doc.querySelector('[class*="published" i]')?.textContent;
  const publishedMoment = publishedRaw ? moment.utc(publishedRaw) : undefined;
  if (publishedMoment && publishedMoment.isValid()) {
    return publishedMoment.format("YYYY-MM-DD");
  }

  // Wikipedia
  // "This page was last edited on 16 June 2023, at 01:19 (UTC)."
  const editedDatetimeMatch = doc.body.textContent?.match(
    /This page was last edited on (.+), at (.+)\s\(UTC\)\./
  );
  if (editedDatetimeMatch) {
    const dateRaw = editedDatetimeMatch[1];
    const date = moment.utc(dateRaw).format("YYYY-MM-DD");
    const time = editedDatetimeMatch[2];
    const editedMoment = moment.utc(`${date}T${time}Z`);
    if (editedMoment.isValid()) {
      return editedMoment.format("YYYY-MM-DD HH:mm UTC");
    }
  }

  return undefined;
}

function extractFromSeparator(title: string, separatorIndex: number) {
  const sourceTitle = title.slice(0, separatorIndex);
  const sourcePublication = title.slice(separatorIndex + 3);
  return { sourceTitle, sourcePublication };
}

function getAuthors(doc: Document) {
  for (const { test, transform } of authorFinders) {
    if (!test(doc)) {
      continue;
    }
    const authors = transform(doc).filter(isDefined);
    if (authors && authors.length) {
      return authors;
    }
  }
  return undefined;
}

interface MediaExcerptInfo {
  sourceDescription: string;
  pincite?: string;
  authors?: CreatePersorgInput[];
}

interface DescriptionTestTransform {
  test: (doc: Document) => boolean;
  transform: (doc: Document) => string | undefined;
}

interface AuthorTestTransform {
  test: (doc: Document) => boolean;
  transform: (doc: Document) => (CreatePersorgInput | undefined)[];
}

const sourceDescriptionFinders: DescriptionTestTransform[] = [
  {
    // https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1280342/
    test: (doc) => !!doc.querySelector('meta[name="citation_title"]'),
    transform: (doc) => {
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
      const doiPart = doi ? `doi:${doi}` : "";
      const sourceDescription = `“${title}” ${journal} ${volumePart}${datePart}${pagePart}. ${doiPart}`;
      return sourceDescription.replace(/\s+/, " ").trim();
    },
  },
  {
    // https://www.nytimes.com/live/2023/06/24/world/russia-ukraine-news
    test: (doc) =>
      Array.from(
        doc.querySelectorAll('script[type="application/ld+json"]')
      ).some(
        (el) => JSON.parse(el.textContent ?? "")?.["@type"] === "NewsArticle"
      ),
    transform: (doc) => {
      const lds = Array.from(
        doc.querySelectorAll('script[type="application/ld+json"]')
      )
        .map((el) => JSON.parse(el.textContent ?? "null"))
        .filter((json) => !!json);
      const articleLd = lds.find((ld) => ld["@type"] === "NewsArticle");
      if (!articleLd) {
        return undefined;
      }

      const organizationLd = lds.find(
        (ld) => ld["@type"] === "NewsMediaOrganization"
      );

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
      const datePublished = formatDate(rawDate);

      const publisherPart = publisher ? ` ${publisher}` : "";
      const datePart = datePublished ? ` (${datePublished})` : "";
      const sourceDescription = `“${title}”${publisherPart}${datePart}`;
      return sourceDescription.replace(/\s+/, " ").trim();
    },
  },
  {
    // https://aeon.co/essays/what-crusaders-daggers-reveal-about-medieval-love-and-violence
    test: (doc) =>
      // Wikipedia's JSON-LD results in poor source descriptions:
      // `“American theoretical physicist (1918–1988)” Wikimedia Foundation, Inc. (2001-11-07)`
      !doc.title.match(/wikipedia/i) &&
      Array.from(
        doc.querySelectorAll('script[type="application/ld+json"]')
      ).some((el) => JSON.parse(el.textContent ?? "")?.["@type"] === "Article"),
    transform: (doc) => {
      const lds = Array.from(
        doc.querySelectorAll('script[type="application/ld+json"]')
      )
        .map((el) => JSON.parse(el.textContent ?? "null"))
        .filter((json) => !!json);
      const articleLd = lds.find((ld) => ld["@type"] === "Article");
      if (!articleLd) {
        return undefined;
      }

      const publisher = articleLd.publisher?.name;
      let title =
        articleLd.headline ||
        doc
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content") ||
        doc.title;
      if (doc.title.match(/aeon/i)) {
        // Aeon has an og:title that includes the publication name.
        title = title.replace(/ \| Aeon Essays$/, "");
      }

      const rawDate =
        articleLd.datePublished ||
        doc
          .querySelector('meta[property="article:published_time"]')
          ?.getAttribute("content") ||
        doc.querySelector('meta[name="pdate"]')?.getAttribute("content");
      const datePublished = formatDate(rawDate);

      const publisherPart = publisher ? ` ${publisher}` : "";
      const datePart = datePublished ? ` (${datePublished})` : "";
      const sourceDescription = `“${title}”${publisherPart}${datePart}`;
      return sourceDescription.replace(/\s+/, " ").trim();
    },
  },
  {
    test: (doc: Document) =>
      !!doc.querySelector('meta[property="og:type"][content="article"]'),
    transform: (doc: Document) => {
      const publisher = doc
        .querySelector('meta[property="og:site_name"]')
        ?.getAttribute("content");

      let title =
        doc
          .querySelector('meta[property="og:title"]')
          ?.getAttribute("content") || doc.title;
      if (doc.title.match(/aeon/i)) {
        // Aeon has an og:title that includes the publication name.
        title = title.replace(/ \| Aeon Essays$/, "");
      }

      const rawDate =
        doc
          .querySelector('meta[property="article:published_time"]')
          ?.getAttribute("content") ||
        doc.querySelector('meta[name="pdate"]')?.getAttribute("content");
      const datePublished = rawDate && formatDate(rawDate);
      const publisherPart = publisher ? ` ${publisher}` : "";
      const datePart = datePublished ? ` (${datePublished})` : "";
      const sourceDescription = `“${title}”${publisherPart}${datePart}`;
      return sourceDescription.replace(/\s+/, " ").trim();
    },
  },
];

function formatDate(rawDate: string) {
  const date = moment.utc(rawDate);
  if (date.isValid()) {
    return date.format("YYYY-MM-DD");
  }
  return rawDate;
}

const ARTICLE_TYPES = new Set(["NewsArticle", "Article"]);

const authorFinders: AuthorTestTransform[] = [
  {
    test: (doc) =>
      // Wikipedia's JSON-LD lists "Contributors to Wikimedia projects" as the author, which is not
      // something we would include in a citation-like source description.
      !doc.title.match(/wikipedia/i) &&
      Array.from(
        doc.querySelectorAll('script[type="application/ld+json"]')
      ).some((el) => {
        const ld = JSON.parse(el.textContent ?? "null");
        if (!ld) {
          return false;
        }
        return ARTICLE_TYPES.has(ld["@type"]) && ld.author;
      }),
    transform: (doc) => {
      const lds: (Article | NewsArticle)[] = Array.from(
        doc.querySelectorAll('script[type="application/ld+json"]')
      )
        .map((el) => JSON.parse(el.textContent ?? "null"))
        .filter((ld) => ld && ARTICLE_TYPES.has(ld["@type"]));
      if (lds.length === 0) {
        return [];
      }
      if (lds.length > 1) {
        console.warn(
          `Found ${lds.length} Articles/NewsArticle LDs, using the first one.`
        );
      }
      const articleLd = lds[0];
      if (!articleLd.author) {
        return [];
      }
      const authors = Array.isArray(articleLd.author)
        ? articleLd.author.map((author: NewsArticleAuthor) => toPersorg(author))
        : [toPersorg(articleLd.author)];
      return authors;
    },
  },
  {
    // https://html.spec.whatwg.org/multipage/links.html#link-type-author
    // NPR: https://www.npr.org/2023/06/22/1183653543/titan-submersible-missing-adventure-tourism-rescue-risk-cost
    test: (doc) => doc.querySelectorAll('a[rel="author"]').length > 0,
    transform: (doc) =>
      Array.from(doc.querySelectorAll('a[rel="author"]')).map((el) =>
        el.textContent
          ? {
              name: el.textContent,
              isOrganization: false,
            }
          : undefined
      ),
  },
  {
    // https://html.spec.whatwg.org/multipage/semantics.html#the-author-element
    // Pubmed: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC1280342/
    test: (doc) =>
      doc.querySelectorAll('meta[name="citation_author"]').length > 0,
    transform: (doc) =>
      Array.from(doc.querySelectorAll('meta[name="citation_author"]')).map(
        (el) => {
          const content = el.getAttribute("content");
          if (!content) {
            return undefined;
          }
          return {
            name: content,
            isOrganization: false,
          };
        }
      ),
  },
  {
    // https://www.nytimes.com/live/2023/06/24/world/russia-ukraine-news
    test: (doc) => doc.querySelectorAll('meta[name="byl"]').length > 0,
    transform: (doc) =>
      Array.from(doc.querySelectorAll('meta[name="byl"]')).map((el) => {
        const content = el.getAttribute("content");
        if (!content) {
          return undefined;
        }
        return {
          name: content.replace(/^by /i, ""),
          isOrganization: false,
        };
      }),
  },
];

function toPersorg(author: NewsArticleAuthor): CreatePersorgInput | undefined {
  const name = getPersorgNameFromAuthor(author);
  if (!name) {
    return undefined;
  }
  const isOrganization = getIsOrganizationFromAuthor(author);
  const knownFor = getKnownForFromAuthor(author);
  return {
    name,
    isOrganization,
    knownFor,
  };
}

function getPersorgNameFromAuthor(
  author: NewsArticleAuthor
): string | undefined {
  if (isString(author)) {
    return author;
  }
  if (!("name" in author) || !author.name) {
    return undefined;
  }
  if (isString(author.name)) {
    return author.name;
  }
  if ("textValue" in author.name && isString(author.name.textValue)) {
    return author.name.textValue;
  }
  return undefined;
}

function getIsOrganizationFromAuthor(author: NewsArticleAuthor): boolean {
  if (isString(author)) {
    return false;
  }
  if (!("@type" in author)) {
    return false;
  }
  return author["@type"] !== "Person";
}

function getKnownForFromAuthor(author: NewsArticleAuthor): string | undefined {
  if (isString(author)) {
    return undefined;
  }
  if (!("description" in author) || !author.description) {
    return undefined;
  }
  if (isString(author.description)) {
    return author.description;
  }
  if (
    "textValue" in author.description &&
    isString(author.description.textValue)
  ) {
    return author.description.textValue;
  }
  return undefined;
}
