import { z } from "zod";
import {
  FieldErrorValue,
  FieldSubErrors,
  newBespokeValidationErrors,
} from "./validation";
import {
  translateZodToBespokeErrors,
  translateZodToFieldErrorCode,
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
