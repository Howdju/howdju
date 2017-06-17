const {query} = require('../db')

class ActionsDao {
  createAction(userId, actionType, entityId, actionTargetType, now, actionSubjectType, subjectEntityId) {
    return query(`
        insert into actions (user_id, action_type, target_id, target_type, tstamp, subject_type, subject_id) 
        values ($1, $2, $3, $4, $5, $6, $7)
      `,
        [userId, actionType, entityId, actionTargetType, now, actionSubjectType, subjectEntityId]
    )
        .then(({rows: [row]}) => row)
  }
}

module.exports = new ActionsDao()