const {arrayToObject} = require('howdju-common')

const {routes, idValidator} = require('./route')
const {getValidationErrors} = require('./validation')

const routesById = arrayToObject(routes, 'id')

describe('validation', () => {
  test('should validate request', () => {
    const routedRequest = {
      pathParameters: ['abc']
    }
    const readPropositionRoute = routesById['readProposition']
    const validationErrors = getValidationErrors(routedRequest, readPropositionRoute.validators)
    expect(validationErrors.length).toBe(1)
    expect(validationErrors[0]).toEqual({
      message: idValidator.message,
      invalidValueLocation: 'pathParameters',
      invalidValue: 'abc'
    })
  })
})
