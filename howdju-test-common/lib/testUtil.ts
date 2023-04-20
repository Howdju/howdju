import { isMoment } from "moment";
import { expect } from "@jest/globals";

import { mapValuesDeep } from "howdju-common";

/**
 * Deeply replaces all Moments with expect.toBeSameMoment.
 *
 * Use on a Jest expected value containing Moments to get reasonable match behavior.
 */
export function expectToBeSameMomentDeep(value: any) {
  return mapValuesDeep(value, (v) =>
    isMoment(v) ? expect.toBeSameMoment(v) : v
  );
}
