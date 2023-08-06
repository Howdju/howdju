import { expect } from "@jest/globals";

import { toBeSameMoment } from "./toBeSameMoment";
import { toBeEqualNode, toBeEqualRange } from "./domMatchers";

expect.extend({
  toBeSameMoment,
  toBeEqualNode,
  toBeEqualRange,
});
