import sinon from "sinon";
import assign from "lodash/assign";
import pick from "lodash/pick";

import {
  utcNow,
  momentAdd,
  momentSubtract,
  makeCreateRegistrationConfirmation,
  CreateRegistrationRequest,
  TopicMessageSender,
} from "howdju-common";
import { mockLogger } from "howdju-test-common";

import {
  EntityNotFoundError,
  RegistrationAlreadyConsumedError,
  RegistrationExpiredError,
} from "../serviceErrors";
import { RegistrationService } from "./RegistrationService";
import { AuthService } from "./AuthService";
import {
  ApiConfig,
  Database,
  makePool,
  RegistrationRequestsDao,
  UsersService,
} from "..";
import { endPoolAndDropDb, initDb, makeTestDbConfig } from "@/util/testUtil";
import { Pool } from "pg";
import { makeTestProvider } from "@/initializers/TestProvider";

describe("RegistrationService", () => {
  const dbConfig = makeTestDbConfig();
  let pool: Pool;
  let service: RegistrationService;
  let dbName: string;
  beforeEach(async () => {
    dbName = await initDb(dbConfig);

    pool = makePool(mockLogger, { ...dbConfig, database: dbName });
    const database = new Database(mockLogger, pool);

    const provider = makeTestProvider(database);

    service = provider.registrationService;
  });
  afterEach(async () => {
    await endPoolAndDropDb(pool, dbConfig, dbName);
  });
  describe("createRequest", () => {
    test("creates a valid request.", async () => {
      // Arrange
      const email = "the@email.com";
      const registrationRequest: CreateRegistrationRequest = {
        email,
      };

      // Act
      await service.createRequest(registrationRequest);

      // Assert
      const {
        rows: [{ registration_code: registrationCode }],
      } = await pool.query(
        `select registration_code from registration_requests where email = '${email}'`
      );
      expect(await service.checkRequestForCode(registrationCode)).toEqual(
        email
      );
    });
    test("supports creating multiple registration requests", async () => {
      // Arrange
      const email = "the@email.com";
      const registrationRequest: CreateRegistrationRequest = {
        email,
      };
      await service.createRequest(registrationRequest);

      // Act
      await service.createRequest(registrationRequest);

      // Assert
      const {
        rows: [
          { registration_code: registrationCode1 },
          { registration_code: registrationCode2 },
        ],
      } = await pool.query(
        `select registration_code from registration_requests where email = '${email}'`
      );
      expect(registrationCode1).not.toEqual(registrationCode2);
    });
  });

  describe("confirmRegistrationAndLogin", () => {
    test("throws when registration code is missing", async () => {
      const registrationConfirmation = makeCreateRegistrationConfirmation();
      const registrationRequestsDao = {
        readForCode: sinon.fake.returns(null),
      };
      const service = new RegistrationService(
        mockLogger,
        {} as ApiConfig,
        {} as TopicMessageSender,
        {} as UsersService,
        {} as AuthService,
        registrationRequestsDao as unknown as RegistrationRequestsDao
      );

      await expect(
        service.confirmRegistrationAndLogin(registrationConfirmation)
      ).rejects.toThrow(EntityNotFoundError);
    });

    test("throws when registration code is already consumed", async () => {
      const registrationConfirmation = makeCreateRegistrationConfirmation();
      const registrationRequestsDao = {
        readForCode: sinon.fake.returns({
          isConsumed: true,
        }),
      };
      const service = new RegistrationService(
        mockLogger,
        {} as ApiConfig,
        {} as TopicMessageSender,
        {} as UsersService,
        {} as AuthService,
        registrationRequestsDao as unknown as RegistrationRequestsDao
      );

      await expect(
        service.confirmRegistrationAndLogin(registrationConfirmation)
      ).rejects.toThrow(RegistrationAlreadyConsumedError);
    });

    test("throws when registration code is expired", async () => {
      const registrationConfirmation = makeCreateRegistrationConfirmation();

      const registrationRequestsDao = {
        readForCode: sinon.fake.returns({
          expires: momentSubtract(utcNow(), [1, "minute"]),
        }),
      };
      const service = new RegistrationService(
        mockLogger,
        {} as ApiConfig,
        {} as TopicMessageSender,
        {} as UsersService,
        {} as AuthService,
        registrationRequestsDao as unknown as RegistrationRequestsDao
      );

      await expect(
        service.confirmRegistrationAndLogin(registrationConfirmation)
      ).rejects.toThrow(RegistrationExpiredError);
    });

    test("consumes valid registration code and returns created user", async () => {
      const registrationRequest = {
        email: "the-email",
        expires: momentAdd(utcNow(), [5, "minutes"]),
      };
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
        config as ApiConfig,
        {} as TopicMessageSender,
        usersService as unknown as UsersService,
        authService as unknown as AuthService,
        registrationRequestsDao as unknown as RegistrationRequestsDao
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
