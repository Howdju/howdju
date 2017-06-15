const {query} = require('../db')

class ActionsDao {
  createAction(userId, actionType, entityId, actionTargetType, now) {
    return query(
        'insert into actions (user_id, action_type, target_id, target_type, tstamp) values ($1, $2, $3, $4, $5)',
        [userId, actionType, entityId, actionTargetType, now]
    )
        .then(({rows: [row]}) => row)
  }
}

module.exports = new ActionsDao()