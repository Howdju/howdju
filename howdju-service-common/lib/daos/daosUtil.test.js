const {
  normalizeText,
  renumberSqlArgs,
  addArrayParams,
  createParams,
} = require("./daosUtil");

describe("normalizeText", () => {
  test("Should normalize burred characters", () => {
    expect(normalizeText("Thîs will be nörmalized?")).toBe(
      "this will be normalized"
    );
  });
  test("Should normalize punctuation", () => {
    expect(normalizeText("This will be “normalized?”")).toBe(
      "this will be normalized"
    );
  });
  test("Should condense acronyms using periods", () => {
    expect(normalizeText("Washington, D.C. is the best state")).toBe(
      "washington dc is the best state"
    );
  });
});

describe("renumberSqlArgs", () => {
  test("works", () => {
    expect(
      renumberSqlArgs(
        "insert into my_table (column1, column2) values ($1, $2);",
        2
      )
    ).toBe("insert into my_table (column1, column2) values ($3, $4);");
  });
  test("doesn't change when start is zero", () => {
    expect(
      renumberSqlArgs(
        "insert into my_table (column1, column2) values ($1, $2);",
        0
      )
    ).toBe("insert into my_table (column1, column2) values ($1, $2);");
  });
});

describe("addArrayParams", () => {
  test("should work", () => {
    expect(addArrayParams(["a", "b"], ["c", "d"])).toStrictEqual({
      args: ["a", "b", "c", "d"],
      params: ["$3", "$4"],
    });
  });
});

describe("createParams", () => {
  test("works", () => {
    expect(createParams(3, 2)).toStrictEqual(["$2", "$3", "$4"]);
  });
});
