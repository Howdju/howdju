import moment, { Moment } from "moment";
import { diff } from "jest-diff";
import { MatcherContext, ExpectationResult } from "expect";

export function toBeSameMoment(
  this: MatcherContext,
  unparsedReceived: any,
  unparsedExpected: Moment
): ExpectationResult {
  let received: Moment | undefined;
  try {
    received = moment(unparsedReceived);
  } catch {
    // Nothing.
  }
  const expected = moment(unparsedExpected);

  const receivedAsString = received ? received.toISOString() : "<undefined>";
  const expectedAsString = expected.toISOString();

  const pass = received && received.isSame(expected);

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
