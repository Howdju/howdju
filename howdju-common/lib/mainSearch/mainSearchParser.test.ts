import { parseQuery } from "./mainSearchParser";

describe("mainSearchParser", () => {
  test("should parse a simple query", () => {
    expect(parseQuery("hi user:1 'long query'")).toEqual({
      terms: ["hi", "long query"],
      facets: {
        user: "1",
      },
    });
  });
  test("should parse a complex query", () => {
    // TODO negation, disjinction?
    expect(parseQuery("hi !(user:1 OR foo:bar) 'long query'")).toEqual({
      terms: ["hi", "long query"],
      not: {
        // TODO something like this...
        or: {
          facets: {
            user: "1",
            foo: "bar",
          },
        },
      },
    });
  });
  test.todo("should simplify a redundant query");
});
