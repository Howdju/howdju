const forEach = require('lodash/forEach')
const uuid = require('uuid')

const {toUserExternalIds} = require('./orm')

exports.UserExternalIdsDao = class UserExternalIdsDao {

  constructor(database) {
    this.database = database
  }

  createExternalIdsForUserId(userId) {
    const ids = ['googleAnalytics', 'mixpanel', 'heapAnalytics', 'sentry', 'smallchat']

    const args = [userId]
    const params = ['$1']
    forEach(ids, () => {
      args.push(uuid.v4())
      params.push('$' + args.length)
    })
    return this.database.query(`insert into user_external_ids (user_id, google_analytics_id, mixpanel_id, heap_analytics_id, sentry_id, smallchat_id) 
      values (${params.join(',')})
      returning *`, args)
      .then( ({rows: [row]}) => toUserExternalIds(row))
  }
}
