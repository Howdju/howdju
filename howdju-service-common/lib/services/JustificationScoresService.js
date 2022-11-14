const Promise = require('bluebird')
const forEach = require('lodash/forEach')
const isUndefined = require('lodash/isUndefined')
const map = require('lodash/map')

const {
  JustificationVotePolarities,
  JustificationScoreTypes,
  JobHistoryStatuses,
  utcNow,
} = require('howdju-common')

const {
  JobTypes,
  JobScopes,
} = require('../jobEnums')

const sumVotesByJustificationId = (votes, logger) => {
  const voteSumByJustificationId = {}
  forEach(votes, (vote) => {
    let sum = voteSumByJustificationId[vote.justificationId]
    if (isUndefined(sum)) {
      sum = 0
    }

    switch (vote.polarity) {
      case JustificationVotePolarities.POSITIVE:
        sum += vote.deleted ? -1 : 1
        break
      case JustificationVotePolarities.NEGATIVE:
        sum -= vote.deleted ? 1 : -1
        break
      default:
        logger.error(`Unknown JustificationVotePolarities "${vote.polarity} in vote ID ${vote.id}`)
        break
    }

    voteSumByJustificationId[vote.justificationId] = sum
  })

  return voteSumByJustificationId
}

exports.JustificationScoresService = class JustificationScoresService {

  constructor(logger, justificationScoresDao, jobHistoryDao, justificationVotesDao) {
    this.logger = logger
    this.justificationScoresDao = justificationScoresDao
    this.jobHistoryDao = jobHistoryDao
    this.justificationVotesDao = justificationVotesDao
  }

  setJustificationScoresUsingAllVotes() {
    const startedAt = utcNow()
    const jobType = JobTypes.SCORE_JUSTIFICATIONS_BY_GLOBAL_VOTE_SUM
    return this.jobHistoryDao.createJobHistory(jobType, JobScopes.FULL, startedAt)
      .then( (job) => Promise.all([
        this.justificationVotesDao.readVotes(),
        this.justificationScoresDao.deleteScoresForType(JustificationScoreTypes.GLOBAL_VOTE_SUM, job.startedAt, job.id),
      ])
        // TODO(1,2,3): remove exception
        // eslint-disable-next-line promise/no-nesting
        .then( ([votes, deletions]) => {
          this.logger.info(`Deleted ${deletions.length} scores`)
          this.logger.debug(`Recalculating scores based upon ${votes.length} votes`)
          return votes
        })
        .then( (votes) => this.processVoteScores(job, votes, this.createJustificationScore))
        // eslint-disable-next-line promise/no-nesting
        .then( (updates) => this.logger.info(`Recalculated ${updates.length} scores`))
        .then( () => {
          const completedAt = utcNow()
          return this.jobHistoryDao.updateJobCompleted(job, JobHistoryStatuses.SUCCESS, completedAt)
        })
        .catch( (err) => {
          const completedAt = utcNow()
          this.jobHistoryDao.updateJobCompleted(job, JobHistoryStatuses.FAILURE, completedAt, err.stack)
          throw err
        })
      )
  }

  updateJustificationScoresUsingUnscoredVotes() {
    const startedAt = utcNow()
    this.logger.silly(`Starting updateJustificationScoresUsingUnscoredVotes at ${startedAt}`)
    return this.jobHistoryDao.createJobHistory(JobTypes.SCORE_JUSTIFICATIONS_BY_GLOBAL_VOTE_SUM, JobScopes.INCREMENTAL, startedAt)

      .then( (job) =>
        this.justificationScoresDao.readUnscoredVotesForScoreType(JustificationScoreTypes.GLOBAL_VOTE_SUM)
          // TODO(1,2,3): remove exception
          // eslint-disable-next-line promise/no-nesting
          .then( (votes) => {
            this.logger.debug(`Recalculating scores based upon ${votes.length} votes since last run`)
            return votes
          })
          .then( (votes) => this.processVoteScores(job, votes, this.createSummedJustificationScore))
          // TODO(1,2,3): remove exception
          // eslint-disable-next-line promise/no-nesting
          .then( (updates) => this.logger.info(`Recalculated ${updates.length} scores`))
          .then( () => {
            const completedAt = utcNow()
            this.logger.silly(`Ending updateJustificationScoresUsingUnscoredVotes at ${completedAt}`)
            return this.jobHistoryDao.updateJobCompleted(job, JobHistoryStatuses.SUCCESS, completedAt)
          })
          .catch( (err) => {
            const completedAt = utcNow()
            this.jobHistoryDao.updateJobCompleted(job, JobHistoryStatuses.FAILURE, completedAt, err.stack)
            throw err
          })
      )
  }

  processVoteScores(job, votes, processVote) {
    return Promise.resolve(sumVotesByJustificationId(votes, this.logger))
      .then( (voteSumByJustificationId) =>
        Promise.all(map(voteSumByJustificationId, (voteSum, justificationId) =>
          processVote.call(this, justificationId, voteSum, job)
        ))
      )
  }

  createJustificationScore(justificationId, score, job) {
    const scoreType = JustificationScoreTypes.GLOBAL_VOTE_SUM
    return this.justificationScoresDao.createJustificationScore(justificationId, scoreType, score, job.startedAt, job.id)
      .then( (justificationScore) => {
        this.logger.debug(`Set justification ${justificationScore.justificationId}'s score to ${justificationScore.score}`)
        return justificationScore
      })
  }

  createSummedJustificationScore(justificationId, voteSum, job) {
    const scoreType = JustificationScoreTypes.GLOBAL_VOTE_SUM
    return this.justificationScoresDao.deleteJustificationScoreForJustificationIdAndType(justificationId, scoreType,
      job.startedAt, job.id)
      .then( (justificationScore) => {
        const currentScore = justificationScore ?
          justificationScore.score :
          0
        const newScore = currentScore + voteSum
        return this.justificationScoresDao.createJustificationScore(justificationId, scoreType, newScore,
          job.startedAt, job.id)
      })
      .then( (justificationScore) => {
        const diffSign = voteSum >= 0 ? '+' : ''
        this.logger.debug(`Updated justification ${justificationScore.justificationId}'s score to ${justificationScore.score} (${diffSign}${voteSum})`)
        return justificationScore
      })
  }
}
