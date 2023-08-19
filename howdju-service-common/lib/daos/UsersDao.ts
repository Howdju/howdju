import { toUser } from "./orm";
import { toIdString } from "./daosUtil";
import { brandedParse, EntityId, UserRef } from "howdju-common";
import { CreateUserDataIn, Database, UserRow } from "..";
import { Moment } from "moment";

export class UsersDao {
  constructor(private database: Database) {}

  async createUser(
    createUser: CreateUserDataIn,
    creatorUserId: EntityId | undefined,
    now: Moment
  ) {
    const {
      rows: [row],
    } = await this.database.query<UserRow>(
      "createUser",
      `
        insert into users
            (email, username, short_name, long_name, phone_number, creator_user_id, is_active, accepted_terms,
             affirmed_majority_consent, affirmed_13_years_or_older, affirmed_not_gdpr, created)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        returning *
      `,
      [
        createUser.email,
        createUser.username,
        createUser.shortName,
        createUser.longName,
        createUser.phoneNumber,
        creatorUserId,
        createUser.isActive,
        createUser.acceptedTerms,
        createUser.affirmedMajorityConsent,
        createUser.affirmed13YearsOrOlder,
        createUser.affirmedNotGdpr,
        now,
      ]
    );
    return brandedParse(UserRef, {
      id: toIdString(row.user_id),
      email: row.email,
      username: row.username,
      longName: row.long_name,
      shortName: row.short_name,
      created: row.created,
      isActive: row.is_active,
    });
  }

  async isEmailInUse(email: string) {
    const {
      rows: [{ in_use }],
    } = await this.database.query(
      "isEmailInUse",
      "select exists(select 1 from users where email = $1 and deleted is null) in_use",
      [email]
    );
    return in_use;
  }

  async isUsernameInUse(username: string) {
    const {
      rows: [{ in_use }],
    } = await this.database.query(
      "isUsernameInUse",
      "select exists(select 1 from users where username = $1 and deleted is null) in_use",
      [username]
    );
    return in_use;
  }

  async readUserForId(userId: EntityId) {
    const {
      rows: [row],
    } = await this.database.query<UserRow>(
      "readUserForId",
      "select * from users join user_external_ids using (user_id) where user_id = $1 and deleted is null",
      [userId]
    );
    return toUser(row);
  }
  async readUserBlurbsForIds(userIds: EntityId[]) {
    const { rows } = await this.database.query(
      "readUserBlurbsForIds",
      "select user_id, long_name from users where user_id = ANY($1) and deleted is null",
      [userIds]
    );
    return rows.map((row) =>
      brandedParse(UserRef, {
        id: toIdString(row.user_id),
        longName: row.long_name,
      })
    );
  }

  async readUserBlurbForId(userId: EntityId) {
    const {
      rows: [row],
    } = await this.database.query(
      "readUserBlurbForId",
      "select user_id, long_name from users where user_id = $1 and deleted is null",
      [userId]
    );
    return brandedParse(UserRef, {
      id: toIdString(row.user_id),
      longName: row.long_name,
    });
  }

  async readUserForEmail(email: string) {
    const { rows } = await this.database.query<UserRow>(
      "readUserForEmail",
      "select * from users join user_external_ids using (user_id) where email = $1 and deleted is null",
      [email]
    );
    return toUser(rows[0]);
  }

  async readUserForUsername(username: string) {
    const { rows } = await this.database.query<UserRow>(
      "readUserForUsername",
      "select * from users join user_external_ids using (user_id) where username = $1 and deleted is null",
      [username]
    );
    return toUser(rows[0]);
  }

  updateLastLoginForUserId(userId: EntityId, now: Moment) {
    return this.database.query(
      "updateLastLoginForUserId",
      "update users set last_login = $1 where user_id = $2",
      [now, userId]
    );
  }
}
