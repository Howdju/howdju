import moment from "moment";
import { expect } from "@jest/globals";

import { expectToBeSameMomentDeep } from "./testUtil";
import { timestampFormatString } from "howdju-common";

describe("expectToBeSameMomentDeep", () => {
  test("replaces moments with expect.toBeSameMoment deeply", () => {
    const timestamp = moment.utc("2022-12-10T04:06:01");
    const bareExpected = {
      timestamp: timestamp,
      anyString: expect.any(String),
      field: {
        timestamp: timestamp,
      },
    };

    const expected = expectToBeSameMomentDeep(bareExpected);

    const timestamp2 = moment(timestamp).format(timestampFormatString);
    const actual = {
      timestamp: timestamp2,
      anyString: "hi",
      field: {
        timestamp: timestamp2,
      },
    };
    expect(timestamp.isSame(timestamp2)).toBe(true);
    expect(actual).toEqual({
      timestamp: expect.toBeSameMoment(timestamp),
      anyString: expect.any(String),
      field: {
        timestamp: expect.toBeSameMoment(timestamp),
      },
    });
    expect(actual).toEqual(expected);
    // Make sure it wouldn't have passed anyway
    expect(actual).not.toEqual(bareExpected);
  });
});
