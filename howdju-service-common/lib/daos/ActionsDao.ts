import {
  ActionSubjectType,
  ActionTargetType,
  ActionType,
  EntityId,
} from "howdju-common";
import { Moment } from "moment";
import { Database } from "..";

export class ActionsDao {
  database: Database;
  constructor(database: Database) {
    this.database = database;
  }

  async createAction(
    userId: EntityId,
    actionType: ActionType,
    targetEntityId: EntityId,
    actionTargetType: ActionTargetType,
    now: Moment,
    actionSubjectType?: ActionSubjectType,
    subjectEntityId?: EntityId
  ) {
    const {
      rows: [row],
    } = await this.database.query<Record<string, never>>(
      "createAction",
      `
        insert into actions (user_id, action_type, target_id, target_type, tstamp, subject_type, subject_id)
        values ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        userId,
        actionType,
        targetEntityId,
        actionTargetType,
        now,
        actionSubjectType,
        subjectEntityId,
      ]
    );
    return row;
  }
}
