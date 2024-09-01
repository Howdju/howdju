import bcrypt from "bcryptjs";
import { Moment } from "moment";

import {
  AuthRefreshToken,
  AuthToken,
  Credentials,
  EntityId,
  EntityTypes,
  momentAdd,
  newImpossibleError,
  UserRef,
  utcNow,
} from "howdju-common";

import {
  EntityNotFoundError,
  UserIsInactiveError,
  InvalidLoginError,
  ReauthenticationRequiredError,
} from "../serviceErrors";
import { HashType, HashTypes } from "../hashTypes";
import { ApiConfig, AuthDao, UsersDao } from "..";
import { UserIdent } from "./types";
import { randomBase64String } from "../crypto";

export class AuthService {
  constructor(
    private config: ApiConfig,
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
    const userId = await this.readOptionalUserIdForAuthToken(authToken);

    if (!userId) {
      throw new EntityNotFoundError("AUTH_TOKEN");
    }
    return userId;
  }

  async createAuthToken(user: UserRef, now: Moment) {
    const authToken = randomBase64String(32);
    const authTokenExpiration = momentAdd(now, this.config.authTokenDuration);

    await this.authDao.createAuthToken(
      user.id,
      authToken,
      now,
      authTokenExpiration
    );

    return {
      authToken,
      authTokenExpiration,
    };
  }

  private async createAuthRefreshToken(user: UserRef, now: Moment) {
    const authRefreshToken = randomBase64String(32);
    const authRefreshTokenExpiration = momentAdd(
      now,
      this.config.authRefreshTokenDuration
    );

    await this.authDao.createAuthRefreshToken(
      user.id,
      authRefreshToken,
      now,
      authRefreshTokenExpiration
    );
    return { authRefreshToken, authRefreshTokenExpiration };
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

  async verifyPassword(credentials: Credentials) {
    const userHash = await this.authDao.readUserHashForEmail(
      credentials.email,
      HashTypes.BCRYPT
    );

    if (!userHash) {
      throw new EntityNotFoundError(EntityTypes.PASSWORD_HASH);
    }

    const { userId, hash } = userHash;
    let isCorrectPassword = false;
    try {
      isCorrectPassword = await bcrypt.compare(credentials.password, hash);
    } catch (err) {
      isCorrectPassword = false;
    }

    if (!isCorrectPassword) {
      throw new InvalidLoginError();
    }

    return userId;
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
    const [
      {
        authToken,
        authTokenExpiration,
        authRefreshToken,
        authRefreshTokenExpiration,
      },
    ] = await Promise.all([
      this.createAuthAndRefreshToken(user, now),
      this.updateLastLogin(user, now),
    ]);
    return {
      user,
      authToken,
      authTokenExpiration,
      authRefreshToken,
      authRefreshTokenExpiration,
    };
  }

  async createAuthAndRefreshToken(user: UserRef, now: Moment) {
    const [
      { authToken, authTokenExpiration },
      { authRefreshToken, authRefreshTokenExpiration },
    ] = await Promise.all([
      this.createAuthToken(user, now),
      this.createAuthRefreshToken(user, now),
      this.updateLastLogin(user, now),
    ]);
    return {
      authToken,
      authTokenExpiration,
      authRefreshToken,
      authRefreshTokenExpiration,
    };
  }

  async refreshAuth(authRefreshToken: AuthRefreshToken) {
    const result = await this.authDao.readAuthRefreshToken(authRefreshToken);
    if (!result) {
      throw new EntityNotFoundError("AUTH_REFRESH_TOKEN", authRefreshToken);
    }
    const { userId, expires: authRefreshTokenExpiration } = result;
    if (authRefreshTokenExpiration.isBefore(utcNow())) {
      throw new ReauthenticationRequiredError(
        "Auth refresh token has expired. Please reauthenticate.",
        authRefreshTokenExpiration
      );
    }

    const user = await this.usersDao.readUserForId(userId);
    if (!user) {
      throw newImpossibleError(
        `User not found for id ${userId} despite having a valid auth refresh token. Referential integrity should prevent this.`
      );
    }
    if (!user.isActive) {
      throw new UserIsInactiveError(user.id);
    }
    const now = utcNow();
    const [{ authToken, authTokenExpiration }] = await Promise.all([
      this.createAuthToken(user, now),
    ]);
    return {
      user,
      authToken,
      authTokenExpiration,
      authRefreshTokenExpiration,
    };
  }

  async logout(
    authToken: AuthToken | undefined,
    authRefreshToken: AuthRefreshToken | undefined
  ) {
    await Promise.all([
      authToken ? this.authDao.deleteAuthToken(authToken) : undefined,
      authRefreshToken
        ? this.authDao.deleteAuthRefreshToken(authRefreshToken)
        : undefined,
    ]);
  }

  private updateLastLogin(user: UserRef, now: Moment) {
    return this.usersDao.updateLastLoginForUserId(user.id, now);
  }
}
