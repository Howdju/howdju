import { z } from "zod";

import { formatZodError } from "howdju-common";

import { EntityValidationError, prefixErrorPath } from "..";

describe("prefixErrorPath", () => {
  test("prepends issue paths", async () => {
    const Thing = z.object({
      name: z.string(),
    });
    async function thunk() {
      const result = await Thing.safeParseAsync({});
      if (!result.success) {
        throw new EntityValidationError(formatZodError(result.error));
      }
      return result.data;
    }

    let err;
    try {
      // Act
      await prefixErrorPath(thunk(), "prefix");
      throw "Should have failed validation.";
    } catch (e) {
      err = e;
    }

    expect(err).toBeInstanceOf(EntityValidationError);
    expect(err).toMatchObject({
      errors: { prefix: { name: { _errors: [{ message: "Required" }] } } },
    });
  });
});
