import { arrayInsertAfter, arrayInsertBefore } from "./util";

describe("arrayInsertAfter", () => {
  test("inserts a value in an array after another", () => {
    const arr = ["a", "b", "c"];

    arrayInsertAfter(arr, "b", "d");

    expect(arr).toEqual(["a", "b", "d", "c"]);
  });
  test("inserts at the end when the target is absent.", () => {
    const arr = ["a", "b", "c"];

    arrayInsertAfter(arr, "e", "d");

    expect(arr).toEqual(["a", "b", "c", "d"]);
  });
});
describe("arrayInsertBefore", () => {
  test("inserts a value in an array before another", () => {
    const arr = ["a", "b", "c"];

    arrayInsertBefore(arr, "b", "d");

    expect(arr).toEqual(["a", "d", "b", "c"]);
  });
  test("inserts at the end when the target is absent.", () => {
    const arr = ["a", "b", "c"];

    arrayInsertBefore(arr, "e", "d");

    expect(arr).toEqual(["a", "b", "c", "d"]);
  });
});
