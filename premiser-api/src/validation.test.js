const {arrayToObject} = require('howdju-common')

const {routes, idValidator} = require('./route')
const {getValidationErrors} = require('./validation')

const routesById = arrayToObject(routes, 'id')

describe('validation', () => {
  test('should validate request', () => {
    const routedRequest = {
      pathParameters: ['abc']
    }
    const readStatementRoute = routesById['readStatement']
    const validationErrors = getValidationErrors(routedRequest, readStatementRoute.validators)
    expect(validationErrors.length).toBe(1)
    expect(validationErrors[0]).toEqual({
      message: idValidator.message,
      invalidValueLocation: 'pathParameters',
      invalidValue: 'abc'
    })
  })
})
