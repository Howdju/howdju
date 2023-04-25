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
  anchors: TextAnchor[];
  date: Date;
}

// TODO(38) dedupe with TextQuoteAnchor in the extension package, UrlTargetAnchor_TextQuote (entites), and UrlTargetAnchor (zodSchemas).
export interface TextAnchor {
  type: UrlTargetAnchorType;
  // Texts correspond to dom-anchor-text-quote
  exactText: string;
  prefixText: string;
  suffixText: string;
  // Offsets correspond to dom-anchor-text-position
  startOffset: number;
  endOffset: number;
}
