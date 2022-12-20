import { z } from "zod";
import {
  formatZodError,
  makeModelErrors,
  removeZodErrorDupes,
  zodIssueFormatter,
} from "./zodError";

describe("removeZodErrorDupes", () => {
  test("Removes duplicate issues", () => {
    const error = new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["a", "b"],
        message: "message-1",
      },
      {
        code: z.ZodIssueCode.custom,
        path: ["a", "b"],
        message: "message-1",
      },
      {
        code: z.ZodIssueCode.custom,
        path: ["a", "b"],
        message: "message-2",
      },
    ]).format(zodIssueFormatter);

    const actualDeduped = removeZodErrorDupes(error);

    const expectedDeduped = new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["a", "b"],
        message: "message-1",
      },
      {
        code: z.ZodIssueCode.custom,
        path: ["a", "b"],
        message: "message-2",
      },
    ]).format(zodIssueFormatter);
    expect(actualDeduped).toEqual(expectedDeduped);
  });
});

describe("makeModelErrors", () => {
  test("Returns correct error for string", () => {
    type User = { user: { name: string } };
    const error = makeModelErrors<User>((r) =>
      r.user.name("Email is already in use.")
    );

    expect(error).toEqual(
      formatZodError(
        new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            path: ["user", "name"],
            message: "Email is already in use.",
          },
        ])
      )
    );
  });
  test("Returns correct error for object", () => {
    type User = { user: { name: string } };
    const error = makeModelErrors<User>((r) =>
      r.user.name({
        message: "Email is already in use.",
        params: { email: "a@b.com" },
      })
    );

    expect(error).toEqual(
      formatZodError(
        new z.ZodError([
          {
            code: z.ZodIssueCode.custom,
            path: ["user", "name"],
            message: "Email is already in use.",
            params: { email: "a@b.com" },
          },
        ])
      )
    );
  });
});
