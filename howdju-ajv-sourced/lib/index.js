const {makeAjv, makeValidate, emptyValidationResult} = require('howdju-common')

const ajv = makeAjv()
const validate = makeValidate(ajv)


module.exports = {
  ajv,
  validate,
  emptyValidationResult,
}
