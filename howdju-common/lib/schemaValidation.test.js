const moment = require('moment')

const {
  schemaIds,
  validate,
} = require('./schemaValidation')

describe('schemaValidation', () => {
  describe('validate', () => {
    
    test('validates valid data', () => {
      const validRegistrationConfirmation = {
        username: 'carl_gieringer',
        shortName: 'Carl',
        longName: 'Gieringer',
        password: '123456',
        doesAcceptTerms: true,
      }
      expect(validate(schemaIds.registrationConfirmation, validRegistrationConfirmation)).toEqual({isValid: true, errors: {}})
    })
    
    test('validates invalid data', () => {
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
    
    test('validates moment', () => {
      const schema = {
        properties: {
          someDateTime: {
            isMoment: {}
          }
        }
      }
      const data = {
        someDateTime: moment()
      }

      const {isValid} = validate(schema, data)
      expect(isValid).toBe(true)
    })
  })
  
})
