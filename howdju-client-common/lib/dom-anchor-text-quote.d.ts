declare module "dom-anchor-text-quote" {
  import { Selector as TextPositionAnchor } from "dom-anchor-text-position";

  interface TextQuoteAnchor {
    prefix: string;
    exact: string;
    suffix: string;
  }

  function fromRange(root: Node, range: Range): TextQuoteAnchor;

  interface Selector {
    prefix?: string;
    exact?: string;
    suffix?: string;
  }

  function fromTextPosition(
    root: Node,
    selector: TextPositionAnchor
  ): TextQuoteAnchor;

  interface Options {
    // the quote search will prioritize matches that are closer to this offset over equivalent
    // matches that are farther away.
    hint?: number;
  }

  function toRange(
    root: Node,
    selector: Selector,
    options: Options = {}
  ): Range;

  function toTextPosition(root, selector: Selector, options: Options = {});
}
