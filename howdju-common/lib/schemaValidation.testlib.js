const { z } = require("zod");

const {
  schemaIds,
  translateAjvToZodFormattedError,
  jsonPointerToObjectPath,
} = require("./schemaValidation");

// Allow us to do the same tests with the sourced validation as with the standalone validation.
// Doing so will help keep them in sync.
export const doTests = (validate) => {
  describe("schemaValidation", () => {
    describe("validate", () => {
      test("validates a user", () => {
        const user = {
          username: "carl_gieringer",
          email: "carl.gieringer@domain.com",
          shortName: "Carl",
          longName: "Gieringer",
          acceptedTerms: "2021-01-01T00:00:00Z",
          affirmedMajorityConsent: "2021-01-01T00:00:00Z",
          affirmed13YearsOrOlder: "2021-01-01T00:00:00Z",
          affirmedNotGdpr: "2021-01-01T00:00:00Z",
        };
        expect(validate(schemaIds.user, user)).toEqual({
          isValid: true,
          errors: {},
        });
      });
    });
    describe("jsonPointerToObjectPath", () => {
      test("works correctly", () => {
        expect(jsonPointerToObjectPath("a/b/0/c")).toEqual(["a", "b", 0, "c"]);
      });
    });
    describe("translateAjvToZodFormattedError", () => {
      test("translates correctly.", () => {
        // ErrorObject[]
        const ajvErrors = [
          {
            keyword: "the-keyword",
            instancePath: "/foo/bar/0/baz",
            schemaPath: "the-schema-path",
            params: {},
            message: "the-error-message",
          },
        ];

        const zodError = translateAjvToZodFormattedError(ajvErrors);

        expect(zodError).toEqual({
          _errors: [],
          foo: {
            _errors: [],
            bar: {
              _errors: [],
              0: {
                _errors: [],
                baz: {
                  _errors: [
                    {
                      code: z.ZodIssueCode.custom,
                      message: "the-error-message",
                      path: ["foo", "bar", 0, "baz"],
                    },
                  ],
                },
              },
            },
          },
        });
      });
    });
  });
};
