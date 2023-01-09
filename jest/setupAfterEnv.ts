import { expect } from "@jest/globals";
// import { Moment } from "moment";

import { toBeSameMoment } from "./toBeSameMoment";

expect.extend({
  toBeSameMoment,
});

// declare module "expect" {
//   interface AsymmetricMatchers {
//     toBeSameMoment(moment: Moment): void;
//   }
//   interface Matchers<R> {
//     toBeSameMoment(moment: Moment): R;
//   }
// }

// declare global {
//   // eslint-disable-next-line @typescript-eslint/no-namespace
//   namespace jest {
//     interface Matchers<R> {
//       toBeSameMoment(m: Moment): R;
//     }
//   }
// }

// export {};
