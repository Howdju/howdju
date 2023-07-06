const bcrypt = require("bcryptjs");
const cryptohat = require("cryptohat");
const Promise = require("bluebird");

const { EntityTypes, utcNow } = require("howdju-common");

const {
  EntityNotFoundError,
  UserIsInactiveError,
  EntityValidationError,
  InvalidLoginError,
  AuthenticationError,
} = require("../serviceErrors");
const { HashTypes } = require("../hashTypes");

exports.AuthService = class AuthService {
  constructor(config, logger, credentialValidator, authDao, usersDao) {
    this.config = config;
    this.logger = logger;
    this.credentialValidator = credentialValidator;
    this.authDao = authDao;
    this.usersDao = usersDao;
  }

  readOptionalUserIdForAuthToken(authToken) {
    if (!authToken) {
      return Promise.resolve(null);
    }
    return this.authDao.getUserIdForAuthToken(authToken);
  }

  readUserIdForUserIdent(userIdent) {
    const { authToken, userId } = userIdent;
    if (userId) {
      return userId;
    }
    return this.readUserIdForAuthToken(authToken);
  }

  readUserIdForAuthToken(authToken) {
    if (!authToken) {
      throw new AuthenticationError();
    }
    return this.readOptionalUserIdForAuthToken(authToken).then((userId) => {
      if (!userId) {
        throw new AuthenticationError("Auth token is invalid");
      }
      return userId;
    });
  }

  createAuthToken(user, now) {
    const authToken = cryptohat(256, 36);
    const expires = now.clone();
    expires.add(this.config.authTokenDuration);

    return this.authDao
      .insertAuthToken(user.id, authToken, now, expires)
      .then(() => ({ authToken, expires }));
  }

  createOrUpdatePasswordAuthForUserId(userId, password) {
    return (
      Promise.all([
        bcrypt.hash(password, this.config.auth.bcrypt.saltRounds),
        this.authDao.readUserHashForId(userId, HashTypes.BCRYPT),
      ])
        .then(([hash, extantUserHash]) => {
          if (extantUserHash) {
            return this.authDao.updateUserAuthForUserId(
              userId,
              hash,
              HashTypes.BCRYPT
            );
          }
          return this.authDao.createUserAuthForUserId(
            userId,
            hash,
            HashTypes.BCRYPT
          );
        })
        // conceal the hash.  We never want to return it to any request
        .then((userHash) => ({}))
    );
  }

  async createPasswordHashAuthForUserId(
    userId,
    passwordHash,
    passwordHashType
  ) {
    return await this.authDao.createUserAuthForUserId(
      userId,
      passwordHash,
      passwordHashType
    );
  }

  verifyPassword(credentials) {
    return this.authDao
      .readUserHashForEmail(credentials.email, HashTypes.BCRYPT)
      .then((userHash) => {
        if (!userHash) {
          throw new EntityNotFoundError(EntityTypes.PASSWORD_HASH);
        }
        this.logger.silly("Found user hash");
        const { userId, hash } = userHash;
        let verifyPromise;
        try {
          verifyPromise = bcrypt.compare(credentials.password, hash);
          this.logger.silly("proceeding past verify call");
        } catch (err) {
          this.logger.error("failed verification", { err });
          verifyPromise = false;
        }
        return Promise.all([verifyPromise, userId]);
      })
      .then(([isVerified, userId]) => {
        if (!isVerified) {
          throw new InvalidLoginError();
        }

        return userId;
      });
  }

  validateCredentials(credentials) {
    const validationErrors = this.credentialValidator.validate(credentials);
    if (validationErrors.hasErrors) {
      throw new EntityValidationError({ credentials: validationErrors });
    }
    return credentials;
  }

  login(credentials) {
    return Promise.resolve()
      .then(() => this.validateCredentials(credentials))
      .then(() => this.verifyPassword(credentials))
      .then((userId) => this.usersDao.readUserForId(userId))
      .then((user) => ensureActive(user))
      .then((user) => {
        const now = utcNow();
        return Promise.all([
          user,
          this.createAuthToken(user, now),
          updateLastLogin(this, user, now),
        ]);
      })
      .then(([user, { authToken, expires }]) => ({
        user,
        authToken,
        expires,
      }));
  }

  logout(authToken) {
    return this.authDao.deleteAuthToken(authToken);
  }
};

function updateLastLogin(self, user, now) {
  return self.usersDao.updateLastLoginForUserId(user.id, now);
}

function ensureActive(user) {
  if (!user.isActive) {
    throw new UserIsInactiveError(user.userId);
  }
  return user;
}
