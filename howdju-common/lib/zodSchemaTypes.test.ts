import { isBareRef } from "./zodSchemaTypes";

describe("isBareRef", () => {
  test("returns true if the object is only a ref", () => {
    expect(isBareRef({ id: "id" })).toBe(true);
  });
  test("returns false if the object is only a ref having a different BRAND", () => {
    expect(isBareRef({ id: "id", otherProp: "value" })).toBe(false);
  });
});
