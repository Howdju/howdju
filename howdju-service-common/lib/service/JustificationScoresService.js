const moment = require('moment')
const isUndefined = require('lodash/isUndefined')

const {
  JustificationVotePolarity,
  JustificationScoreType,
  zeroDate,
} = require('howdju-common')

const sumVotesByJustificationId = (votes, logger) => {
  const voteSumByJustificationId = {}
  forEach(votes, (vote) => {
    let sum = voteSumByJustificationId[vote.targetId]
    if (isUndefined(sum)) {
      sum = 0
    }

    switch (vote.polarity) {
      case JustificationVotePolarity.POSITIVE:
        sum += 1
        break
      case JustificationVotePolarity.NEGATIVE:
        sum -= 1
        break
      default:
        logger.error(`Unknown JustificationVotePolarity "${vote.polarity} in vote ID ${vote.id}`)
        break
    }

    voteSumByJustificationId[vote.targetId] = sum
  })
}

exports.JustificationScoresService = class JustificationScoresService {
  constructor(logger, justificationScoresDao, jobsDao, votesDao) {
    this.logger = logger
    this.justificationScoresDao = justificationScoresDao
    this.jobHistoryDao = jobsDao
    this.votesDao = votesDao
  }

  scoreJustificationsVotedUponSinceLastRun() {
    const lastRunHistory = this.jobHistoryDao.lastRunForJobType(JobTypes.SCORE_JUSTIFICATIONS)
    const lastRun = lastRunHistory ? lastRunHistory.completedAt : moment(zeroDate())
    // How deal with timing edge cases?  Really need some sort of continuation token or something
    const votes = this.votesDao.readVotesForTypeSince(VoteTargetType.JUSTIFICATION, lastRun)
    const voteSumByJustificationId = sumVotesByJustificationId(votes, this.logger)
    return Promise.all(map(voteSumByJustificationId, (voteSum, justificationId) =>
      this.updateJustificationScore(justificationId, voteSum)
    ))
  }

  updateJustificationScore(justificationId, voteSum) {
    const scoreType = JustificationScoreType.GLOBAL_VOTE_SUM
    return this.justificationScoresDao.readJustificationScoreForJustificationIdAndType(justificationId, scoreType)
        .then( (justificationScore) =>
            this.justificationScoresDao.updateJustificationScore(justificationId, scoreType, justificationScore.score + voteSum))
  }
}