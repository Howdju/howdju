const {
  doTests: doSchemaValidationTests,
} = require("howdju-common/lib/schemaValidation.testlib");
const { validate } = require("./index");

doSchemaValidationTests(validate);
