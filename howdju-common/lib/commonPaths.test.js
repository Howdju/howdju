const { commonPaths } = require("./commonPaths");

describe("commonPaths", () => {
  test("a path", () => {
    expect(commonPaths.confirmRegistration()).toBe("/complete-registration");
  });
});
