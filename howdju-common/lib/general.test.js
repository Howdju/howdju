const { uniq } = require("lodash");
const moment = require("moment");

const {
  cleanWhitespace,
  momentAdd,
  omitDeep,
  momentSubtract,
  mapValuesDeep,
} = require("./general");

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
  test("Should map deep arrays correctly", () => {
    expect(
      mapValuesDeep(
        {
          arr: ["one", "one", "two"],
        },
        uniq
      )
    ).toEqual({
      arr: ["one", "two"],
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
