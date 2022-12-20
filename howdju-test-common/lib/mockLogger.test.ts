import { mockLogger } from "./mockLogger";

describe("mockLogger", () => {
  test("logs without error", () => {
    expect(() => mockLogger.log("a message")).not.toThrow();
  });
});
