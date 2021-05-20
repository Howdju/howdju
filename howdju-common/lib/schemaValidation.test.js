const moment = require('moment')
const {toJson} = require("./schemaValidation")

const {
  schemaIds,
  makeAjv,
  makeValidate,
} = require('./schemaValidation')

const ajv = makeAjv()
const validate = makeValidate(ajv)

describe('schemaValidation', () => {
  describe('validate', () => {

    test('validates valid registration confirmation', () => {
      const validRegistrationConfirmation = {
        username: 'carl_gieringer',
        shortName: 'Carl',
        longName: 'Gieringer',
        password: '123456',
        doesAcceptTerms: true,
      }
      expect(validate(schemaIds.registrationConfirmation, validRegistrationConfirmation)).toEqual({isValid: true, errors: {}})
    })

    test('invalidates an invalid registration confirmation', () => {
      const invalidRegistrationConfirmation = {
        username: 'carl#gieringer',
        password: '123',
        shortName: '',
        longName: '',
        doesAcceptTerms: false,
      }

      const {isValid, errors} = validate(schemaIds.registrationConfirmation, invalidRegistrationConfirmation)
      expect(isValid).toBe(false)
      expect(errors).toEqual({
        username: expect.objectContaining({
          keyword: 'pattern'
        }),
        password: expect.objectContaining({
          keyword: 'minLength'
        }),
        longName: expect.objectContaining({
          keyword: 'minLength'
        }),
        doesAcceptTerms: expect.objectContaining({
          keyword: 'const'
        })
      })
    })

    test('validates a user', () => {
      const user = {
        username: 'carl_gieringer',
        email: 'carl.gieringer@domain.com',
        shortName: 'Carl',
        longName: 'Gieringer',
        acceptedTerms: moment()
      }
      expect(validate(schemaIds.user, toJson(user))).toEqual({isValid: true, errors: {}})
    })
  })

})
