const sinon = require('sinon')
const pick = require('lodash/pick')

const {
  utcNow,
} = require('howdju-common')

const {
  EntityNotFoundError,
  RegistrationAlreadyConsumedError,
  RegistrationExpiredError,
} = require('../serviceErrors')

const {RegistrationsService} = require('./RegistrationsService')


const {
  mockLogger
} = require('howdju-test-common')

describe('RegistrationsService', () => {
  
  describe('confirmRegistration', () => {
  
    test('missing registration code', async () => {
      const registrationsDao = {
        readRegistrationForCompletionCode: sinon.fake.returns(null),
      }
      const service = new RegistrationsService(mockLogger, null, null, null, registrationsDao)
      
      await expect(service.confirmRegistration('some-code')).rejects.toThrow(EntityNotFoundError)
    })
  
    test('consumed registration code', async () => {
      const registrationsDao = {
        readRegistrationForCompletionCode: sinon.fake.returns({
          isConsumed: true
        }),
      }
      const service = new RegistrationsService(mockLogger, null, null, null, registrationsDao)

      await expect(service.confirmRegistration('some-code')).rejects.toThrow(RegistrationAlreadyConsumedError)
    })
  
    test('expired registration code', async () => {
      const registrationsDao = {
        readRegistrationForCompletionCode: sinon.fake.returns({
          expires: utcNow().subtract([1, 'minute'])
        }),
      }
      const service = new RegistrationsService(mockLogger, null, null, null, registrationsDao)

      await expect(service.confirmRegistration('some-code')).rejects.toThrow(RegistrationExpiredError)
    })
  
    test('consumes valid registration code and returns created user', async () => {

      const registration = {
        username: 'the-username',
        passwordHash: 'the-password-hash',
        passwordHashType: 'the-password-hash-type',
        email: 'the-email',
        longName: 'the-looooong-name',
        shortName: 'the-short-name',
      }
      const userIn = pick(registration, ['username', 'email', 'longName', 'shortName'])
      const config = {auth: {bcrypt: {saltRounds: 1}}}
      const registrationsDao = {
        readRegistrationForCompletionCode: sinon.fake.returns(registration),
        consumeRegistrationForCompletionCode: sinon.fake(),
      }
      const usersService = {
        isUsernameInUse: sinon.fake.returns(false),
        createRegisteredUser: sinon.fake.returns(userIn),
      }

      const service = new RegistrationsService(mockLogger, config, null, usersService, registrationsDao)
      const confirmationCode = 'confirmation-code'
      const registrationConfirmation = {
        username: 'the-username',
        password: 'the-password-hash',
        longName: 'the-looooong-name',
        shortName: 'the-short-name',
      }
      
      // Act
      const userOut = await service.confirmRegistration(confirmationCode, registrationConfirmation)
      
      expect(userOut).toEqual(userIn)
      sinon.assert.calledWith(registrationsDao.consumeRegistrationForCompletionCode, confirmationCode)
    })
  })
})