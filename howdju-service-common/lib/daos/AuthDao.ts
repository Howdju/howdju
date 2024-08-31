import { get, toString } from "lodash";
import { Moment } from "moment";

import { AuthRefreshToken, AuthToken, EntityId, utcNow } from "howdju-common";

import { toUserHash } from "./orm";
import { Database, UserHashRow } from "..";
import { HashType } from "../hashTypes";

export class AuthDao {
  constructor(private database: Database) {}

  async createUserAuthForUserId(
    userId: EntityId,
    hash: string,
    hashType: HashType
  ) {
    const {
      rows: [row],
    } = await this.database.query<UserHashRow>(
      "createUserAuthForUserId",
      "insert into user_auth (user_id, hash, hash_type) values ($1, $2, $3) returning *",
      [userId, hash, hashType]
    );
    return toUserHash(row);
  }

  async readUserHashForId(userId: EntityId, hashType: HashType) {
    const {
      rows: [row],
    } = await this.database.query<UserHashRow>(
      "readUserHashForId",
      `
      select
          ua.user_id
        , ua.hash
      from users u join user_auth ua using (user_id)
        where
              u.deleted is null
          and ua.user_id = $1
          and ua.hash_type = $2`,
      [userId, hashType]
    );
    return toUserHash(row);
  }

  async readUserHashForEmail(email: string, hashType: HashType) {
    const {
      rows: [row],
    } = await this.database.query<UserHashRow>(
      "readUserHashForEmail",
      `
        select
            ua.user_id
          , ua.hash
        from users u join user_auth ua using (user_id)
          where
                u.deleted is null
            and u.email = $1
            and ua.hash_type = $2
      `,
      [email, hashType]
    );
    return toUserHash(row);
  }

  async updateUserAuthForUserId(
    userId: EntityId,
    hash: string,
    hashType: HashType
  ) {
    const { rows } = await this.database.query<UserHashRow>(
      "updateUserAuthForUserId",
      "update user_auth set hash = $2 where user_id = $1 and hash_type = $3 returning *",
      [userId, hash, hashType]
    );
    if (rows.length < 1) {
      throw new Error(`No user_auth row found for userId ${userId}`);
    }
    return toUserHash(rows[0]);
  }

  async insertAuthToken(
    userId: EntityId,
    authToken: AuthToken,
    created: Moment,
    expires: Moment
  ) {
    const {
      rows: [row],
    } = await this.database.query(
      "insertAuthToken",
      "insert into user_auth_tokens (user_id, auth_token, created, expires) values ($1, $2, $3, $4) returning auth_token",
      [userId, authToken, created, expires]
    );
    return get(row, "auth_token");
  }

  async createAuthRefreshToken(
    userId: EntityId,
    authRefreshToken: AuthRefreshToken,
    created: Moment,
    expires: Moment
  ) {
    const {
      rows: [row],
    } = await this.database.query(
      "insertAuthRefreshToken",
      `insert into auth_refresh_tokens
       (user_id, auth_refresh_token, created, expires)
       values ($1, $2, $3, $4)
       returning auth_refresh_token`,
      [userId, authRefreshToken, created, expires]
    );
    return row.auth_refresh_token;
  }

  async readAuthRefreshToken(authRefreshToken: AuthRefreshToken) {
    const {
      rows: [row],
    } = await this.database.query(
      "readAuthRefreshToken",
      `select user_id, expires
       from auth_refresh_tokens
       where auth_refresh_token = $1`,
      [authRefreshToken]
    );
    if (!row) {
      return undefined;
    }
    const { user_id: userId, expires } = row;
    return { userId, expires };
  }

  async deleteAuthRefreshToken(authRefreshToken: AuthRefreshToken) {
    const {
      rows: [row],
    } = await this.database.query(
      "deleteAuthRefreshToken",
      `delete from auth_refresh_tokens
       where auth_refresh_token = $1
       returning user_id`,
      [authRefreshToken]
    );
    return row?.user_id;
  }

  async deleteAuthToken(authToken: AuthToken) {
    const {
      rows: [row],
    } = await this.database.query(
      "deleteAuthToken",
      "delete from user_auth_tokens where auth_token = $1 returning user_id",
      [authToken]
    );
    return get(row, "user_id");
  }

  async getUserIdForAuthToken(authToken: AuthToken) {
    const sql = `
      select u.user_id
      from user_auth_tokens uat
          join users u using (user_id)
        where
              uat.auth_token = $1
          and uat.expires > $2
          and uat.deleted is null
          and u.deleted is null
          and u.is_active
    `;
    const { rows } = await this.database.query("getUserIdForAuthToken", sql, [
      authToken,
      utcNow(),
    ]);
    if (rows.length < 1) {
      return undefined;
    }
    const [{ user_id: userId }] = rows;
    return toString(userId);
  }
}
