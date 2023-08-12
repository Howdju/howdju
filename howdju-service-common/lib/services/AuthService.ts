import bcrypt from "bcryptjs";
import { Moment } from "moment";

import {
  AuthToken,
  Credentials,
  EntityId,
  EntityTypes,
  Logger,
  UserRef,
  utcNow,
} from "howdju-common";

import {
  EntityNotFoundError,
  UserIsInactiveError,
  InvalidLoginError,
  AuthenticationError,
} from "../serviceErrors";
import { HashType, HashTypes } from "../hashTypes";
import { ApiConfig, AuthDao, UsersDao } from "..";
import { UserIdent } from "./types";
import { randomBase64String } from "../crypto";

export class AuthService {
  constructor(
    private config: ApiConfig,
    private logger: Logger,
    private authDao: AuthDao,
    private usersDao: UsersDao
  ) {}

  readOptionalUserIdForAuthToken(authToken: AuthToken | undefined) {
    if (!authToken) {
      return undefined;
    }
    return this.authDao.getUserIdForAuthToken(authToken);
  }

  readOptionalUserIdForUserIdent(userIdent: UserIdent) {
    const { authToken, userId } = userIdent;
    if (userId) {
      return userId;
    }
    if (!authToken) {
      return undefined;
    }
    return this.readOptionalUserIdForAuthToken(authToken);
  }

  readUserIdForUserIdent(userIdent: UserIdent) {
    const { authToken, userId } = userIdent;
    if (userId) {
      return userId;
    }
    if (!authToken) {
      throw new Error(`UserIdent requires either authToken or userId`);
    }
    return this.readUserIdForAuthToken(authToken);
  }

  async readUserBlurbForUserIdent(userIdent: UserIdent) {
    let { userId } = userIdent;
    const { authToken } = userIdent;
    if (!userId) {
      if (!authToken) {
        throw new Error(`UserIdent requires either authToken or userId`);
      }
      userId = await this.readUserIdForAuthToken(authToken);
    }
    return this.usersDao.readUserBlurbForId(userId);
  }

  async readUserIdForAuthToken(authToken: AuthToken) {
    if (!authToken) {
      throw new AuthenticationError();
    }
    const userId = await this.readOptionalUserIdForAuthToken(authToken);

    if (!userId) {
      throw new AuthenticationError("Auth token is invalid");
    }
    return userId;
  }

  createAuthToken(user: UserRef, now: Moment) {
    const authToken = randomBase64String(32);
    const expires = now.clone();
    expires.add(this.config.authTokenDuration);

    return this.authDao
      .insertAuthToken(user.id, authToken, now, expires)
      .then(() => ({ authToken, expires }));
  }

  createOrUpdatePasswordAuthForUserId(userId: EntityId, password: string) {
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
        .then((_userHash) => ({}))
    );
  }

  async createPasswordHashAuthForUserId(
    userId: EntityId,
    passwordHash: string,
    passwordHashType: HashType
  ) {
    return await this.authDao.createUserAuthForUserId(
      userId,
      passwordHash,
      passwordHashType
    );
  }

  verifyPassword(credentials: Credentials) {
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

  async login(credentials: Credentials) {
    const userId = await this.verifyPassword(credentials);
    const user = await this.usersDao.readUserForId(userId);
    if (!user) {
      throw new EntityNotFoundError("USER", userId);
    }
    if (!user.isActive) {
      throw new UserIsInactiveError(user.id);
    }
    const now = utcNow();
    const [{ authToken, expires }] = await Promise.all([
      this.createAuthToken(user, now),
      this.updateLastLogin(user, now),
    ]);
    return {
      user,
      authToken,
      expires,
    };
  }

  logout(authToken: AuthToken) {
    return this.authDao.deleteAuthToken(authToken);
  }

  private updateLastLogin(user: UserRef, now: Moment) {
    return this.usersDao.updateLastLoginForUserId(user.id, now);
  }
}
