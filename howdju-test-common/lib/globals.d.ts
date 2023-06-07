import { Moment } from "moment";
import "jest-extended";

declare module "expect" {
  interface AsymmetricMatchers {
    toBeSameMoment(m: Moment): void;
  }
  interface Matchers<R> {
    toBeSameMoment(m: Moment): R;
  }
}
