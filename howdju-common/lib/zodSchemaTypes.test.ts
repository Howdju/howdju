import { z } from "zod";

import { isOnlyRef, isRef } from "./zodSchemaTypes";

describe("isOnlyRef", () => {
  test("returns true if the object is only a ref", () => {
    expect(isOnlyRef({ id: "id", [z.BRAND]: "SomeEntity" })).toBe(true);
  });
  test("returns true if the object is only a ref having the BRAND", () => {
    expect(isOnlyRef({ id: "id", [z.BRAND]: "SomeEntity" }, "SomeEntity")).toBe(
      true
    );
  });
  test("returns false if the object is only a ref having a different BRAND", () => {
    expect(
      isOnlyRef({ id: "id", [z.BRAND]: "SomeEntity" }, "OtherEntity")
    ).toBe(false);
  });
  test("returns false if the object lacks an ID", () => {
    expect(isOnlyRef({ [z.BRAND]: "SomeEntity" })).toBe(false);
  });
  test("returns false if the object lacks a BRAND", () => {
    expect(isOnlyRef({ id: "id" })).toBe(false);
  });
  test("returns false if the object has extra properties", () => {
    expect(isOnlyRef({ id: "id", [z.BRAND]: "SomeEntity", name: "name" })).toBe(
      false
    );
  });
});

describe("isRef", () => {
  test("returns true if the object has just an ID", () => {
    expect(isRef({ id: "id" })).toBe(true);
  });
  test("throws if the object has a BRAND but no id", () => {
    expect(() =>
      // @ts-expect-error - testing invalid input
      isRef({ [z.BRAND]: "SomeEntity" })
    ).toThrowErrorMatchingInlineSnapshot(
      `"Ref has a BRAND but lacks an ID (BRAND: SomeEntity)."`
    );
  });
  test("returns true if the object has an ID and a BRAND", () => {
    expect(isRef({ id: "id", [z.BRAND]: "SomeEntity" })).toBe(true);
  });
  test("returns true if the object has extra properties", () => {
    expect(isRef({ id: "id", [z.BRAND]: "SomeEntity", name: "name" })).toBe(
      true
    );
  });
});
