const moment = require('moment')
const {toJsonVal} = require("./schemaValidation")

const {
  schemaIds,
} = require('./schemaValidation')

// Allow us to do the same tests with the sourced validation as with the standalone validation.
// Doing so will help keep them in sync.
export const doTests = (validate) => {
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
        expect(validate(schemaIds.user, toJsonVal(user))).toEqual({isValid: true, errors: {}})
      })
    })

  })
}

