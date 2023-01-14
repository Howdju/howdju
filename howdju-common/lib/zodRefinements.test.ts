import moment from "moment";
import { momentObject } from "./zodRefinements";

describe("momentObject", () => {
  test("validates Moment", () => {
    expect(momentObject.safeParse(moment())).toMatchObject({ success: true });
  });
  test("invalidates non-Moment", () => {
    expect(momentObject.safeParse(new Date())).toMatchObject({
      success: false,
      error: { issues: [{ message: "Must be a moment timestamp." }] },
    });
  });
});
