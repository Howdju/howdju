import { Moment, isMoment } from "moment";
import { diff } from "jest-diff";
import { MatcherContext, ExpectationResult } from "expect";
import { toString } from "lodash";

export function toBeSameMoment(
  this: MatcherContext,
  received: any,
  expected: Moment
): ExpectationResult {
  if (!isMoment(expected)) {
    throw new Error(
      `toBeSameMoment must expect a moment, but got ${typeof expected}: ${toString(
        expected
      )}`
    );
  }
  const receivedAsString = isMoment(received)
    ? received.toISOString()
    : toString(received);
  const expectedAsString = expected.toISOString();

  const pass = expected.isSame(received);

  const message = pass
    ? () =>
        `${this.utils.matcherHint(".not.toBe")}\n\n` +
        "Expected moment not to be same as other moment:\n" +
        `  ${this.utils.printExpected(expectedAsString)}\n` +
        "Received:\n" +
        `  ${this.utils.printReceived(receivedAsString)}`
    : () => {
        const diffString = diff(expectedAsString, receivedAsString, {
          expand: this.expand,
        });
        return (
          `${this.utils.matcherHint(".toBe")}\n\n` +
          "Expected moment to be (using isSame):\n" +
          `  ${this.utils.printExpected(expectedAsString)}\n` +
          "Received:\n" +
          `  ${this.utils.printReceived(receivedAsString)}${
            diffString ? `\n\nDifference:\n\n${diffString}` : ""
          }`
        );
      };
  return { message, pass };
}
