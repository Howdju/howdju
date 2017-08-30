const head = require('lodash/head')

const {warnIfMultiple} = require('./util')
const {toJustificationScore} = require('./orm')

exports.JustificationScoresDao = class JustificationScoresDao {
  constructor(logger, query) {
    this.logger = logger
    this.query = query
  }

  readJustificationScoreForJustificationIdAndType(justificationId, justificationScoreType) {
    return this.query('select * from justification_scores where justification_id = $1 and score_type = $2',
        [justificationId, justificationScoreType])
        .then( ({rows}) => {
          warnIfMultiple(rows, 'justification_scores', {justificationId, justificationScoreType})
          return toJustificationScore(head(rows))
        })
  }

  updateJustificationScore(justificationId, justificationScoreType, score) {
    return this.query('update justification_scores set score = $1 where justification_id = $2 and score_type = $3 returning justification_id')
  }
}
