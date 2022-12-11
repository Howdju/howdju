const sinon = require("sinon");
const assign = require("lodash/assign");
const pick = require("lodash/pick");

const {
  utcNow,
  momentAdd,
  momentSubtract,
  makeRegistrationRequest,
  makeCreateRegistrationConfirmation,
} = require("howdju-common");
const { mockLogger } = require("howdju-test-common");

const {
  EntityNotFoundError,
  RegistrationAlreadyConsumedError,
  RegistrationExpiredError,
} = require("../serviceErrors");
const { RegistrationService } = require("./RegistrationService");

describe("RegistrationService", () => {
  describe("confirmRegistrationAndLogin", () => {
    test("missing registration code", async () => {
      const registrationConfirmation = {};
      const registrationRequestsDao = {
        readForCode: sinon.fake.returns(null),
      };
      const service = new RegistrationService(
        mockLogger,
        null,
        null,
        null,
        null,
        registrationRequestsDao
      );

      await expect(
        service.confirmRegistrationAndLogin(registrationConfirmation)
      ).rejects.toThrow(EntityNotFoundError);
    });

    test("consumed registration code", async () => {
      const registrationConfirmation = {};
      const registrationRequestsDao = {
        readForCode: sinon.fake.returns({
          isConsumed: true,
        }),
      };
      const service = new RegistrationService(
        mockLogger,
        null,
        null,
        null,
        null,
        registrationRequestsDao
      );

      await expect(
        service.confirmRegistrationAndLogin(registrationConfirmation)
      ).rejects.toThrow(RegistrationAlreadyConsumedError);
    });

    test("expired registration code", async () => {
      const registrationConfirmation = {};

      const registrationRequestsDao = {
        readForCode: sinon.fake.returns({
          expires: momentSubtract(utcNow(), [1, "minute"]),
        }),
      };
      const service = new RegistrationService(
        mockLogger,
        null,
        null,
        null,
        null,
        registrationRequestsDao
      );

      await expect(
        service.confirmRegistrationAndLogin(registrationConfirmation)
      ).rejects.toThrow(RegistrationExpiredError);
    });

    test("consumes valid registration code and returns created user", async () => {
      const registrationRequest = makeRegistrationRequest({
        email: "the-email",
        expires: momentAdd(utcNow(), [5, "minutes"]),
      });
      const createRegistrationConfirmation = makeCreateRegistrationConfirmation(
        {
          username: "the-username",
          password: "the-password-hash",
          longName: "the-looooong-name",
          shortName: "the-short-name",
          registrationCode: "registration-code",
        }
      );
      const config = { auth: { bcrypt: { saltRounds: 1 } } };
      const registrationRequestsDao = {
        readForCode: sinon.fake.returns(registrationRequest),
        consumeForCode: sinon.fake.returns(1),
      };

      const userIn = assign(
        {},
        pick(createRegistrationConfirmation, [
          "username",
          "email",
          "longName",
          "shortName",
        ]),
        pick(registrationRequest, ["email"])
      );
      const usersService = {
        isUsernameInUse: sinon.fake.returns(false),
        createRegisteredUser: sinon.fake.returns(userIn),
      };

      const authToken = "the-auth-token";
      const expires = momentAdd(utcNow(), [1, "minute"]);
      const authService = {
        createAuthToken: sinon.fake.returns({ authToken, expires }),
      };

      const service = new RegistrationService(
        mockLogger,
        config,
        null,
        usersService,
        authService,
        registrationRequestsDao
      );

      // Act
      const {
        user: userOut,
        authToken: authTokenOut,
        expires: expiresOut,
      } = await service.confirmRegistrationAndLogin(
        createRegistrationConfirmation
      );

      expect(userOut).toBe(userIn);
      expect(authTokenOut).toBe(authToken);
      expect(expiresOut).toBe(expires);
      sinon.assert.calledWith(
        registrationRequestsDao.consumeForCode,
        createRegistrationConfirmation.registrationCode
      );
    });
  });
});
