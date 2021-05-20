const {makeAjv, makeValidate} = require('howdju-common')

const ajv = makeAjv()
const validate = makeValidate(ajv)

module.exports = {
  ajv,
  validate,
}
