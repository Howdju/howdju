import { CreatePasswordResetRequest, EntityId } from "howdju-common";
import { Moment } from "moment";

import { Database } from "../database";
import { toIdString } from "./daosUtil";

export class PasswordResetRequestsDao {
  constructor(private readonly database: Database) {}

  async create(
    createPasswordResetRequest: CreatePasswordResetRequest,
    userId: EntityId,
    passwordResetCode: string,
    expires: Moment,
    isConsumed: boolean,
    now: Moment
  ) {
    const { email } = createPasswordResetRequest;
    return await this.database.query(
      "PasswordResetRequestsDao.create",
      `
        insert into password_reset_requests (user_id, email, password_reset_code, expires, is_consumed, created)
        values ($1, $2, $3, $4, $5, $6)
        returning *
      `,
      [userId, email, passwordResetCode, expires, isConsumed, now]
    );
  }

  async readForCode(passwordResetCode: string) {
    const {
      rows: [row],
    } = await this.database.query(
      "PasswordResetRequestsDao.readForCode",
      `select * from password_reset_requests where password_reset_code = $1 and deleted is null`,
      [passwordResetCode]
    );
    if (!row) {
      return undefined;
    }
    return {
      id: toIdString(row.password_reset_request_id),
      userId: toIdString(row.user_id),
      email: row.email,
      passwordResetCode: row.password_reset_code,
      expires: row.expires,
      isConsumed: row.isConsumed,
      created: row.created,
    };
  }

  async consumeForCode(passwordResetCode: string) {
    const { rowCount } = await this.database.query(
      "PasswordResetRequestsDao.consumeForCode",
      "update password_reset_requests set is_consumed = true where password_reset_code = $1 and deleted is null",
      [passwordResetCode]
    );
    return rowCount;
  }
}
