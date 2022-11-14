exports.ActionsDao = class ActionsDao {
  constructor(database) {
    this.database = database;
  }

  createAction(
    userId,
    actionType,
    entityId,
    actionTargetType,
    now,
    actionSubjectType,
    subjectEntityId
  ) {
    return this.database
      .query(
        "createAction",
        `
        insert into actions (user_id, action_type, target_id, target_type, tstamp, subject_type, subject_id) 
        values ($1, $2, $3, $4, $5, $6, $7)
      `,
        [
          userId,
          actionType,
          entityId,
          actionTargetType,
          now,
          actionSubjectType,
          subjectEntityId,
        ]
      )
      .then(({ rows: [row] }) => row);
  }
};
