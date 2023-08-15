import moment from "moment";
import { expect } from "@jest/globals";

import { expectToBeSameMomentDeep, restrictObject } from "./testUtil";
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

describe("restrictObject", () => {
  test("restricts an object to the given shape", () => {
    expect(
      restrictObject(
        { a: 1, b: { c: 2 }, d: 3, e: [{ f: 4 }, 5], g: [6, 7], h: [8, 9] },
        {
          a: 10,
          b: { c: 11, i: 12, j: 13 },
          e: [{ f: 14 }],
          g: [15, 16, 17],
          k: [18],
          l: 19,
        }
      )
    ).toEqual({
      // Overwritten by the values object
      a: 10,
      b: {
        // overwritten by the values object
        c: 11,
        // i and j omitted because absent from the shape object
      },
      // d not overwritten because missing from the values object
      d: 3,
      // first value merged
      e: [{ f: 14 }, 5],
      // all values overwritten
      g: [15, 16, 17],
      // not overwritten because missing from the values object
      h: [8, 9],
      // k, l omitted because absent from the shape object
    });
  });
  test("handles exotic objects", () => {
    const a = moment.utc("2022-12-10T04:06:01");
    const aa = moment.utc("2022-12-10T04:06:01");
    expect(restrictObject({ a }, { a: aa })).toEqual({
      a: expect.toBeSameMoment(aa),
    });
  });
  test("handles ignoring an empty array", () => {
    expect(restrictObject({}, { a: [] })).toEqual({});
  });
  test("handles the same object in multiple places", () => {
    const a = { b: 1 };
    expect(restrictObject({ a, c: a }, { a: { b: 2, d: 3 } })).toEqual({
      a: { b: 2 },
      // A quirk of the implementation is that the value will be updated in both places. But d will
      // be removed.
      c: { b: 2 },
    });
  });
});
