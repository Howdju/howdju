import { diff } from "jest-diff";
import { MatcherContext, ExpectationResult } from "expect";
import { toString } from "lodash";

export function toBeEqualNode(
  this: MatcherContext,
  received: any,
  expected: Node
): ExpectationResult {
  if (!(expected instanceof Node)) {
    throw new Error(
      `toBeEqualNode must expect a Node, but got ${typeof expected}: ${toString(
        expected
      )}`
    );
  }
  if (!(received instanceof Node)) {
    throw new Error(
      `toBeEqualNode must receive a Node, but got ${typeof expected}: ${toString(
        expected
      )}`
    );
  }
  const receivedAsString = `${describeNodeType(received.nodeType)}: ${
    received.textContent
  }`;
  const expectedAsString = `${describeNodeType(expected.nodeType)}: ${
    expected.textContent
  }`;

  const pass = received.isEqualNode(expected);

  const message = pass
    ? () =>
        `${this.utils.matcherHint(".not.toBeEqualNode")}\n\n` +
        "Expected Node not to be equial to:\n" +
        `  ${this.utils.printExpected(expectedAsString)}\n` +
        "Received:\n" +
        `  ${this.utils.printReceived(receivedAsString)}`
    : () => {
        const diffString = diff(expectedAsString, receivedAsString, {
          expand: this.expand,
        });
        return (
          `${this.utils.matcherHint(".toBeEqualNode")}\n\n` +
          "Expected Node to be (using isEqualNode):\n" +
          `  ${this.utils.printExpected(expectedAsString)}\n` +
          "Received:\n" +
          `  ${this.utils.printReceived(receivedAsString)}${
            diffString ? `\n\nDifference:\n\n${diffString}` : ""
          }`
        );
      };
  return { message, pass };
}

export function toBeEqualRange(
  this: MatcherContext,
  received: any,
  expected: Range
): ExpectationResult {
  if (!(expected instanceof Range)) {
    throw new Error(
      `toBeEqualRange must expect a Range, but got ${typeof expected}: ${toString(
        expected
      )}`
    );
  }
  if (!(received instanceof Range)) {
    throw new Error(
      `toBeEqualRange must receive a Range, but got ${typeof expected}: ${toString(
        received
      )}`
    );
  }

  const pass =
    received.startContainer.isEqualNode(expected.startContainer) &&
    received.startOffset === expected.startOffset &&
    received.endContainer.isEqualNode(expected.endContainer) &&
    received.endOffset === expected.endOffset;

  function describeRange(range: Range): string {
    return `${describeNodeType(range.startContainer.nodeType)}[${
      range.startOffset
    }]: ${range.startContainer.textContent} – ${describeNodeType(
      range.endContainer.nodeType
    )}[${range.endOffset}]: ${range.endContainer.textContent}`;
  }

  const receivedAsString = describeRange(received);
  const expectedAsString = describeRange(expected);
  const message = pass
    ? () =>
        `${this.utils.matcherHint(".not.toBeEqualRange")}\n\n` +
        "Expected Range not to be equial to:\n" +
        `  ${this.utils.printExpected(expectedAsString)}\n` +
        "Received:\n" +
        `  ${this.utils.printReceived(receivedAsString)}`
    : () => {
        const diffString = diff(expectedAsString, receivedAsString, {
          expand: this.expand,
        });
        return (
          `${this.utils.matcherHint(".toBeEqualRange")}\n\n` +
          "Expected Range to be:\n" +
          `  ${this.utils.printExpected(expectedAsString)}\n` +
          "Received:\n" +
          `  ${this.utils.printReceived(receivedAsString)}${
            diffString ? `\n\nDifference:\n\n${diffString}` : ""
          }`
        );
      };
  return { message, pass };
}

function describeNodeType(nodeType: number): string {
  switch (nodeType) {
    case Node.ELEMENT_NODE:
      return "ELEMENT_NODE";
    case Node.TEXT_NODE:
      return "TEXT_NODE";
    case Node.COMMENT_NODE:
      return "COMMENT_NODE";
    case Node.DOCUMENT_NODE:
      return "DOCUMENT_NODE";
    case Node.DOCUMENT_TYPE_NODE:
      return "DOCUMENT_TYPE_NODE";
    case Node.DOCUMENT_FRAGMENT_NODE:
      return "DOCUMENT_FRAGMENT_NODE";
    default:
      return `Unknown node type ${nodeType}`;
  }
}
