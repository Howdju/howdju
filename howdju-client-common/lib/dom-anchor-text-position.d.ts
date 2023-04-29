declare module "dom-anchor-text-position" {
  interface TextPositionAnchor {
    start: number;
    end: number;
  }

  function fromRange(root: Node, range: Range): TextPositionAnchor;

  interface Selector {
    start?: number;
    end?: number;
  }

  function toRange(root: Node, selector: Selector = {});
}
