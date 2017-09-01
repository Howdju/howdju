const {mapSingle} = require('./util')
const {toJustificationScore} = require('./orm')

exports.JustificationScoresDao = class JustificationScoresDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  readJustificationScoreForJustificationIdAndType(justificationId, justificationScoreType) {
    return this.database.query('select * from justification_scores where justification_id = $1 and score_type = $2',
      [justificationId, justificationScoreType])
      .then(mapSingle(this.logger, toJustificationScore, 'justification_scores', {justificationId, justificationScoreType}))
  }

  updateJustificationScore(justificationId, justificationScoreType, score) {
    return this.database.query(
      'update justification_scores set score = $1 where justification_id = $2 and score_type = $3 returning justification_id',
      [score, justificationId, justificationScoreType]
    )
  }
}
