import { expect } from "@jest/globals";

import { toBeSameMoment } from "./toBeSameMoment";

expect.extend({
  toBeSameMoment,
});
