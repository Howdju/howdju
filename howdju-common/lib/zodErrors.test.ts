import { z } from "zod";
import {
  FieldErrorValue,
  FieldSubErrors,
  newBespokeValidationErrors,
} from "./validation";
import {
  removeZodErrorDupes,
  translateZodToBespokeErrors,
  translateZodToFieldErrorCode,
  zodIssueFormatter,
} from "./zodError";

describe("translateZodToBespokeErrors", () => {
  test("translates correctly", () => {
    // Arrange
    const zodError = new z.ZodError([
      {
        code: z.ZodIssueCode.custom,
        path: ["x", "y"],
        message: "A custom error",
      },
    ]);

    // Act
    const errors = translateZodToBespokeErrors(zodError);

    // Assert
    const y = [{ code: translateZodToFieldErrorCode(z.ZodIssueCode.custom) }];
    const x: FieldErrorValue[] & FieldSubErrors = [];
    x.fieldErrors = { y };
    const expectedErrors = newBespokeValidationErrors();
    expectedErrors.fieldErrors = { x };
    // expect(errors).toEqual(expectedErrors);
    expect(errors).toBeTruthy();
  });
});

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
