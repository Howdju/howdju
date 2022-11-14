const { makeStandaloneValidate } = require("./schemaValidation");

// See bin/gen-standalone-schema-validation.js
module.exports.validate = makeStandaloneValidate(require(`./standaloneAjv`));
