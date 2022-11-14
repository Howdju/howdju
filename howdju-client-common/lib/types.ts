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

export interface TextQuoteAnchor {
  type: UrlTargetAnchorType;
  // exact, prefix, and suffix come from dom-anchor-text-quote
  exact: string;
  prefix: string;
  suffix: string;
  // start, end come from dom-anchor-text-position
  start: number;
  end: number;
}
