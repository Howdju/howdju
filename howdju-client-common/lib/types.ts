import { UrlTargetAnchorType } from "howdju-common";

export interface ExtensionAnnotationContent {
  type: "text";
  title: string;
  text: string;
}

export interface Source {
  url: string;
  title: string;
}

export interface Target {
  url: string;
  anchors: TextQuoteAnchor[];
  date: Date;
}

// TODO: dedupe with TextQuoteAnchor in the extension package, UrlTargetAnchor_TextQuote (entites), and UrlTargetAnchor (zodSchemas).
export interface TextQuoteAnchor {
  type: UrlTargetAnchorType;
  // Texts correspond to dom-anchor-text-quote
  exactText: string;
  prefixText: string;
  suffixText: string;
  // Offsets correspond to dom-anchor-text-position
  startOffset: number;
  endOffset: number;
}
