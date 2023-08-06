declare module "dom-anchor-text-quote" {
  import { TextPositionAnchor } from "dom-anchor-text-position";

  interface TextQuoteAnchor {
    prefix: string;
    exact: string;
    suffix: string;
  }

  interface Options {
    // the quote search will prioritize matches that are closer to this offset over equivalent
    // matches that are farther away.
    hint?: number;
  }
  interface Selector {
    prefix?: string;
    exact?: string;
    suffix?: string;
  }

  function fromRange(root: Node, range: Range): TextQuoteAnchor;

  function toRange(
    root: Node,
    selector: Selector,
    options: Options = {}
  ): Range | null;

  function fromTextPosition(
    root: Node,
    selector: TextPositionAnchor
  ): TextQuoteAnchor;

  function toTextPosition(
    root: Node,
    selector: Selector,
    options: Options = {}
  ): TextPositionAnchor | null;
}
