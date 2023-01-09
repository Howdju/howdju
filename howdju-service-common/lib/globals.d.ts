import { Moment } from "moment";

declare module "expect" {
  interface AsymmetricMatchers {
    toBeSameMoment(m: Moment): void;
  }
  interface Matchers<R> {
    toBeSameMoment(m: Moment): R;
  }
}
