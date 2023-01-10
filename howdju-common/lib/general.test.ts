import { uniq, isNumber, camelCase } from "lodash";
import moment from "moment";

import {
  cleanWhitespace,
  momentAdd,
  omitDeep,
  momentSubtract,
  mapValuesDeep,
  mapKeysDeep,
} from "./general";

describe("cleanWhitespace", () => {
  test("Should combine adjacent whitespace", () => {
    expect(cleanWhitespace("This     will   be     cleaned")).toBe(
      "This will be cleaned"
    );
  });
  test("Should replace whitespace with spaces", () => {
    expect(cleanWhitespace("This\t\twill\nbe\fcleaned")).toBe(
      "This will be cleaned"
    );
  });
  test("Should not change characters or capitalization", () => {
    expect(cleanWhitespace("This   wîll be   clëaned?")).toBe(
      "This wîll be clëaned?"
    );
  });
});

describe("mapValuesDeep", () => {
  test("Should map arrays correctly with mapArrays=false", () => {
    expect(
      mapValuesDeep(
        {
          arr: ["one", "one", "two"],
        },
        uniq,
        { mapArrays: false }
      )
    ).toEqual({
      arr: ["one", "two"],
    });
  });
  test("Should map arrays correctly with mapArrays=true", () => {
    expect(
      mapValuesDeep(
        {
          arr: [{ a: 1 }, { b: 2 }],
        },
        (x) => (isNumber(x) ? x + 1 : x)
      )
    ).toEqual({
      arr: [{ a: 2 }, { b: 3 }],
    });
  });
  test("Should map arrays of strings correctly with mapArrays=true", () => {
    expect(
      mapValuesDeep(
        {
          arr: [{ a: "one" }, { b: "two" }],
        },
        (x) => "_" + x
      )
    ).toEqual({
      arr: [{ a: "_one" }, { b: "_two" }],
    });
  });
});

describe("mapKeysDeep", () => {
  test("Should map keys correctly", () => {
    const mapped = mapKeysDeep(
      {
        field_one: {
          field_two: "value_one",
        },
      },
      camelCase
    );
    expect(mapped).toEqual({
      fieldOne: {
        fieldTwo: "value_one",
      },
    });
  });
});

describe("momentAdd", () => {
  test("Should add correctly", () => {
    const base = moment.utc("2022-11-08T21:44:00");
    const later = momentAdd(base, { hours: 1 });
    expect(later.format()).toBe("2022-11-08T22:44:00Z");
  });
});

describe("momentSubtract", () => {
  test("Should substract correctly", () => {
    const base = moment.utc("2022-11-08T21:44:00");
    const later = momentSubtract(base, { days: 1 });
    expect(later.format()).toBe("2022-11-07T21:44:00Z");
  });
});

describe("omitDeep", () => {
  test("omits deeply", () => {
    const toOmit = {};

    const value = {
      foo: "bar",
      hello: {
        world: "now",
        goodbye: toOmit,
      },
      arr: [1, toOmit, 2, 3],
    };
    expect(omitDeep(value, (val) => val === toOmit)).toEqual({
      foo: "bar",
      hello: {
        world: "now",
      },
      arr: [1, 2, 3],
    });
  });
});