const { doTests } = require("./schemaValidation.testlib");
const { validate } = require("./standaloneValidation");

doTests(validate);
