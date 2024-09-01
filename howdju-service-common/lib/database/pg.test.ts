import moment from "moment";

import { mockLogger } from "howdju-test-common";

import { makeTimestampToUtcMomentParser } from "./pg";

const parser = makeTimestampToUtcMomentParser(mockLogger);

describe("makeTimestampToUtcMomentParser", () => {
  test("parses a timezone-naive timestamp", () => {
    expect(parser("2024-08-31 21:24:30.45")).toBeSameMoment(
      moment.utc("2024-08-31 21:24:30.45")
    );
  });
  test("parses a timezone-aware timestamp", () => {
    expect(parser("2024-11-29 20:20:00.119+00")).toBeSameMoment(
      moment.utc("2024-11-29 20:20:00.119+00")
    );
  });
});
