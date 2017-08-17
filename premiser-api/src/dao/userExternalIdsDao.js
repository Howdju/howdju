const forEach = require('lodash/forEach')
const get = require('lodash/get')
const head = require('lodash/head')
const {query} = require('../db')
const toString = require('lodash/toString')
const uuid = require('uuid')
const {toUserExternalIds} = require('../orm')

class UserExternalIdsDao {

  createExternalIdsForUserId(userId) {
    const ids = ['googleAnalytics', 'mixpanel', 'heapAnalytics', 'sentry', 'smallchat']

    const args = [userId]
    const params = ['$1']
    forEach(ids, (index) => {
      args.push(uuid.v4())

      params.push('$' + args.length)
    })
    return query(`insert into user_external_ids (user_id, google_analytics_id, mixpanel_id, heap_analytics_id, sentry_id, smallchat_id) 
      values (${params.join(',')})
      returning *`, args)
        .then( ({rows: [row]}) => toUserExternalIds(row))
  }
}

module.exports = new UserExternalIdsDao()