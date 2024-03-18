import { uniq, isNumber, camelCase, isString } from "lodash";
import moment from "moment";

import {
  cleanWhitespace,
  momentAdd,
  omitDeep,
  momentSubtract,
  mapValuesDeep,
  mapKeysDeep,
  filterDefined,
  pushAll,
  normalizeQuotation,
  decodeQueryStringObject,
  toSlug,
  toJson,
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

describe("normalizeQuotation", () => {
  test("normalizes a quotation", () => {
    expect(
      normalizeQuotation(`This is a

    full-text quotation 😀.Yay! `)
    ).toBe("this is a full text quotation 😀 yay");
  });
});

describe("toSlug", () => {
  test("should slugify a string", () => {
    expect(toSlug("This is a slug")).toBe("this-is-a-slug");
    expect(toSlug("Stanly is the very model of a modern Major-General")).toBe(
      "stanly-is-the-very-model-of-a-modern-major-general"
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
          arr: [{ a: 1 }, { b: 2, c: "3" }],
        },
        (x) => (isNumber(x) ? x + 1 : x)
      )
    ).toEqual({
      arr: [{ a: 2 }, { b: 3, c: "3" }],
    });
  });
  test("Should map arrays of strings correctly with mapArrays=true", () => {
    expect(
      mapValuesDeep(
        {
          arr: [{ a: "one" }, { b: "two" }],
        },
        (x) => (isString(x) ? "_" + x : x)
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
    // Doesn't change the original moment
    expect(base.format()).toBe("2022-11-08T21:44:00Z");
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

describe("filterDefined", () => {
  test("removes undefined list items", () => {
    expect(
      filterDefined([1, null, "2", undefined, "3", undefined, false, 4])
    ).toEqual([1, null, "2", "3", false, 4]);
  });
  test("removes object values", () => {
    expect(
      filterDefined({
        a: "a",
        b: 1,
        c: undefined,
        d: false,
        e: null,
      })
    ).toEqual({
      a: "a",
      b: 1,
      d: false,
      e: null,
    });
  });
});

describe("pushAll", () => {
  test("modifies the array", () => {
    const arr = [1, 2, 3];

    pushAll(arr, [4, 5, 6]);

    expect(arr).toEqual([1, 2, 3, 4, 5, 6]);
  });
  test("returns the array", () => {
    const arr = [1, 2, 3];

    const ret = pushAll(arr, [4, 5, 6]);

    expect(ret).toEqual([1, 2, 3, 4, 5, 6]);
  });
});

describe("decodeQueryStringObject", () => {
  test("decodes a query string object", () => {
    expect(decodeQueryStringObject("foo=bar,hello=world")).toEqual({
      foo: "bar",
      hello: "world",
    });
  });
  test("decodes a query string object having valid keys", () => {
    expect(
      decodeQueryStringObject("foo=bar,hello=world", ["foo", "hello"])
    ).toEqual({
      foo: "bar",
      hello: "world",
    });
  });
  test("throws for a query string object having invalid keys", () => {
    expect(() =>
      decodeQueryStringObject("foo=bar,hello=world", ["foo", "baz"])
    ).toThrowErrorMatchingSnapshot();
  });
});

describe("toJson", () => {
  test("should stringify an object", () => {
    expect(toJson({ a: 1, b: "2" })).toBe('{"a":1,"b":"2"}');
  });
  test("handles circular references", () => {
    const obj: any = { a: 1, b: "2" };
    obj.c = { d: obj };
    expect(toJson(obj)).toBe('{"a":1,"b":"2","c":{"d":"[Circular]"}}');
  });
  test("does not consider all identical fields circular", () => {
    const child = { d: 3 };
    const obj: any = { a: child, b: child };
    expect(toJson(obj)).toBe('{"a":{"d":3},"b":{"d":3}}');
  });
  test("serializes moments as ISO strings", () => {
    const obj: any = { a: moment.utc("2022-11-08T21:44:00") };
    expect(toJson(obj)).toBe('{"a":"2022-11-08T21:44:00.000Z"}');
  });
});
