declare module "dom-anchor-text-position" {
  interface TextPositionAnchor {
    start: number;
    end: number;
  }

  interface Selector {
    start?: number;
    end?: number;
  }

  function fromRange(root: Node, range: Range): TextPositionAnchor;

  function toRange(root: Node, selector: Selector = {}): Range;
}
