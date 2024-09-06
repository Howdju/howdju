import { api, extension } from "./index";

describe("package works", () => {
  test("can import the things", () => {
    expect(api).toBeTruthy();
    expect(extension).toBeTruthy();
  });
});
