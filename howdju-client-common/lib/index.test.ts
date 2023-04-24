import { actions, extension } from "./index";

describe("package works", () => {
  test("can import the things", () => {
    expect(actions).toBeTruthy();
    expect(extension).toBeTruthy();
  });
});
