const {makeStandaloneCode, standaloneAjvModuleName} = require("../lib/schemaValidation")

const standaloneAjvPath = `../lib/${standaloneAjvModuleName}.js`

function writeStandaloneCode() {
  const moduleCode = makeStandaloneCode()
  const fs = require("fs")
  const path = require("path")
  fs.writeFileSync(path.resolve(__dirname, standaloneAjvPath), moduleCode)
}
writeStandaloneCode()
console.log(`wrote ${standaloneAjvPath}`)
