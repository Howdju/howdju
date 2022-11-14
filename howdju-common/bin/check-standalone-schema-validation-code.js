const debug = require("debug")("howdju:howdju-common");

checkStandaloneSchemaValidationCode();

/**
 * Check if the standalone schema validation on the file system matches generated from the current source code.
 *
 * The extension runs with strict CSP rules. It is not allowed to contain eval. AJV schema generation
 * uses eval. But AJV offers a standalone mode. To use the standalone mode, we must generate the
 * standlone schema validation code and commit it. There is the possibility of skew between the
 * code that is currently in the persisted file and the code that would be newly generated.
 * This function checks that they are the same.
 */
function checkStandaloneSchemaValidationCode() {
  const { makeStandaloneCode } = require("../lib/schemaValidation");

  const fs = require("fs");
  const path = require("path");
  const filePath = path.resolve(__dirname, `../lib/standaloneAjv.js`);
  const standaloneCode = fs.readFileSync(filePath, { encoding: "utf8" });

  if (makeStandaloneCode() !== standaloneCode) {
    throw new Error(
      "File system standalone AJV does not match generated one." +
        " Please run `yarn run gen-standalone-schema-validation` and commit the" +
        " result."
    );
  }

  debug("Standalone schema validation is up-to-date.");
}
