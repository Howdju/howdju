const fs = require("fs");
const path = require("path");

const { makeStandaloneCode } = require("../lib/schemaValidation");

// ../.. is relative to dist/bin/ where the script will be built
const standaloneAjvPath = path.resolve(__dirname, `../../lib/standaloneAjv.js`);
const moduleCode = makeStandaloneCode();
fs.writeFileSync(standaloneAjvPath, moduleCode);
console.log(`wrote ${standaloneAjvPath}`);
