import { isMoment } from "moment";

import { mapValuesDeep } from "howdju-common";

/**
 * Deeply replaces all Moments with expect.toBeSameMoment.
 *
 * Use on a Jest expected value containing Moments to get reasonable match behavior.
 */
export function expectToBeSameMomentDeep(value: any) {
  return mapValuesDeep(value, (v) =>
    // Can't add `import { expect } from "@jest/globals";` above or else the esbuild fails.
    // So just typecast expect.
    // TODO(388) remove the typecast.
    isMoment(v) ? (expect as any).toBeSameMoment(v) : v
  );
}
