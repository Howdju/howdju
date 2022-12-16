import { mockLogger } from "./index";

describe("mockLogger", () => {
  test("logs without error", () => {
    expect(() => mockLogger.log("a message")).not.toThrow();
  });
});
