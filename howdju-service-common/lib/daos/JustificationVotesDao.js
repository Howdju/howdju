const map = require("lodash/map");

const {
  negateJustificationVotePolarity,
  requireArgs,
} = require("howdju-common");

const { toJustificationVote } = require("./orm");
const { mapSingle, mapMany } = require("./daosUtil");

exports.JustificationVotesDao = class JustificationVotesDao {
  constructor(database) {
    requireArgs({ database });
    this.database = database;
  }

  deleteOpposingVotes(userId, vote) {
    const { justificationId, polarity } = vote;

    const sql = `
      update justification_votes 
        set deleted = $1 
        where 
              user_id = $2 
          and justification_id = $3 
          and polarity = $4
          and deleted is null
        returning justification_vote_id`;
    return this.database
      .query("deleteOpposingVotes", sql, [
        new Date(),
        userId,
        justificationId,
        negateJustificationVotePolarity(polarity),
      ])
      .then(({ rows }) => map(rows, (r) => r.justification_vote_id));
  }

  readEquivalentVotes(userId, vote) {
    const { justificationId, polarity } = vote;
    const sql = `
      select * 
      from justification_votes 
        where 
              user_id = $1
          and justification_id = $2
          and polarity = $3
          and deleted is null`;
    return this.database
      .query("readEquivalentVotes", sql, [userId, justificationId, polarity])
      .then(mapMany(toJustificationVote));
  }

  createVote(userId, vote) {
    const { justificationId, polarity } = vote;
    const sql = `
      insert into justification_votes (user_id, justification_id, polarity, created) 
      values ($1, $2, $3, $4) 
      returning *`;
    return this.database
      .query("createVote", sql, [userId, justificationId, polarity, new Date()])
      .then(mapSingle(toJustificationVote));
  }

  deleteEquivalentVotes(userId, vote) {
    const { justificationId, polarity } = vote;
    const sql = `
      update justification_votes 
        set deleted = $1 
        where 
              user_id = $2 
          and justification_id = $3 
          and polarity = $4
          and deleted is null
        returning justification_vote_id`;
    return this.database
      .query("deleteEquivalentVotes", sql, [
        new Date(),
        userId,
        justificationId,
        polarity,
      ])
      .then(({ rows }) => map(rows, (r) => r.justification_vote_id));
  }

  readVotes() {
    return this.database
      .query(
        "readVotes",
        "select * from justification_votes where deleted is null"
      )
      .then(mapMany(toJustificationVote));
  }
};
