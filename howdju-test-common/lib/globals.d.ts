import { Moment } from "moment";
import "jest-extended";

declare module "expect" {
  interface AsymmetricMatchers {
    toBeSameMoment(m: Moment): void;
    toBeEqualNode(node: Node): void;
    toBeEqualRange(range: Range): void;
  }
  interface Matchers<R> {
    toBeSameMoment(m: Moment): R;
    toBeEqualNode(node: Node): R;
    toBeEqualRange(range: Range): R;
  }
}
