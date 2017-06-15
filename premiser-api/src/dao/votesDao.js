const {negatePolarity} = require('../models')
const {toVote} = require('../orm')
const {query} = require('../db')
const map = require('lodash/map')

class VotesDao {
  deleteOpposingVotes(userId, vote) {
    const {targetType, targetId, polarity} = vote

    const sql = `
      update votes 
        set deleted = $1 
        where 
              user_id = $2 
          and target_type = $3 
          and target_id = $4 
          and polarity = $5 
          and deleted is null
        returning vote_id`
    return query(sql, [new Date(), userId, targetType, targetId, negatePolarity(polarity)])
        .then( ({rows}) => map(rows, r => r.vote_id))
  }

  readEquivalentVotes(userId, vote) {
    const {targetType, targetId, polarity} = vote
    const sql = `
      select * 
      from votes 
        where 
              user_id = $1
          and target_type = $2 
          and target_id = $3 
          and polarity = $4
          and deleted is null`
    return query(sql, [userId, targetType, targetId, polarity])
        .then( ({rows}) => map(rows, toVote))
  }

  createVote(userId, vote) {
    const {targetType, targetId, polarity} = vote
    const sql = `
      insert into votes (user_id, target_type, target_id, polarity, created) 
      values ($1, $2, $3, $4, $5) 
      returning *`
    return query(sql, [userId, targetType, targetId, polarity, new Date()])
        .then( ({rows: [row]}) => toVote(row) )
  }

  deleteEquivalentVotes(userId, vote) {
    const {targetType, targetId, polarity} = vote
    const sql = `
      update votes 
        set deleted = $1 
        where 
              user_id = $2 
          and target_type = $3 
          and target_id = $4 
          and polarity = $5 
          and deleted is null
        returning vote_id`
    return query(sql, [new Date(), userId, targetType, targetId, polarity])
        .then( ({rows}) => map(rows, r => r.vote_id))
  }
}

module.exports = new VotesDao()