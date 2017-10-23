const Promise = require('bluebird')
const forEach = require('lodash/forEach')
const flatMap = require('lodash/flatMap')
const isUndefined = require('lodash/isUndefined')
const map = require('lodash/map')

const {
  StatementTagVotePolarity,
  StatementTagScoreType,
  JobHistoryStatus,
  utcNow,
} = require('howdju-common')

const {
  JobTypes,
  JobScopes,
} = require('../jobEnums')

exports.StatementTagScoresService = class StatementTagScoresService {

  constructor(logger, statementTagScoresDao, jobHistoryDao, statementTagVotesDao) {
    this.logger = logger
    this.statementTagScoresDao = statementTagScoresDao
    this.jobHistoryDao = jobHistoryDao
    this.statementTagVotesDao = statementTagVotesDao
  }

  setStatementTagScoresUsingAllVotes() {
    const startedAt = utcNow()
    const jobType = JobTypes.SCORE_STATEMENT_TAGS_BY_GLOBAL_VOTE_SUM
    return this.jobHistoryDao.createJobHistory(jobType, JobScopes.FULL, startedAt)
      /* eslint-disable indent */
      .then( (job) => Promise.all([
          this.statementTagVotesDao.readVotes(),
          this.statementTagScoresDao.deleteScoresForType(StatementTagScoreType.GLOBAL_VOTE_SUM, job.startedAt, job.id)
        ])
          .then( ([votes, deletions]) => {
            this.logger.info(`Deleted ${deletions.length} scores`)
            this.logger.debug(`Recalculating scores based upon ${votes.length} votes`)
            return votes
          })
          .then( (votes) => this.processVoteScores(job, votes, this.createStatementTagScore))
          .then( (updates) => this.logger.info(`Recalculated ${updates.length} scores`))
          .then( () => {
            const completedAt = utcNow()
            return this.jobHistoryDao.updateJobCompleted(job, JobHistoryStatus.SUCCESS, completedAt)
          })
          .catch( (err) => {
            const completedAt = utcNow()
            this.jobHistoryDao.updateJobCompleted(job, JobHistoryStatus.FAILURE, completedAt, err.stack)
            throw err
          })
      )
    /* eslint-enable indent */
  }

  updateStatementTagScoresUsingUnscoredVotes() {
    const startedAt = utcNow()
    this.logger.silly(`Starting updateStatementTagScoresUsingUnscoredVotes at ${startedAt}`)
    return this.jobHistoryDao.createJobHistory(JobTypes.SCORE_STATEMENT_TAGS_BY_GLOBAL_VOTE_SUM, JobScopes.INCREMENTAL, startedAt)
      /* eslint-disable indent */
      .then( (job) =>
        this.statementTagScoresDao.readUnscoredVotesForScoreType(StatementTagScoreType.GLOBAL_VOTE_SUM)
          .then( (votes) => {
            this.logger.debug(`Recalculating scores based upon ${votes.length} votes since last run`)
            return votes
          })
          .then( (votes) => this.processVoteScores(job, votes, this.createSummedStatementTagScore))
          .then( (updates) => this.logger.info(`Recalculated ${updates.length} scores`))
          .then( () => {
            const completedAt = utcNow()
            this.logger.silly(`Ending updateJustificationScoresUsingUnscoredVotes at ${completedAt}`)
            return this.jobHistoryDao.updateJobCompleted(job, JobHistoryStatus.SUCCESS, completedAt)
          })
          .catch( (err) => {
            const completedAt = utcNow()
            this.jobHistoryDao.updateJobCompleted(job, JobHistoryStatus.FAILURE, completedAt, err.stack)
            throw err
          })
      )
    /* eslint-enable indent */
  }

  processVoteScores(job, votes, processVote) {
    return Promise.resolve(sumVotesByStatementIdByTagId(votes, this.logger))
      .then( (voteSumByStatementIdByTagId) =>
        Promise.all(flatMap(voteSumByStatementIdByTagId, (voteSumByStatementId, tagId) => map(voteSumByStatementId, (voteSum, statementId) =>
            processVote.call(this, statementId, tagId, voteSum, job)
        )))
      )
  }

  createStatementTagScore(statementId, tagId, score, job) {
    const scoreType = StatementTagScoreType.GLOBAL_VOTE_SUM
    return this.statementTagScoresDao.createStatementTagScore(statementId, tagId, scoreType, score, job.startedAt, job.id)
      .then( (statementTagScore) => {
        this.logger.debug(`Set statement ${statementTagScore.statementId} / tag ${statementTagScore.tagId}'s score to ${statementTagScore.score}`)
        return statementTagScore
      })
  }

  createSummedStatementTagScore(statementId, tagId, voteSum, job) {
    const scoreType = StatementTagScoreType.GLOBAL_VOTE_SUM
    return this.statementTagScoresDao.deleteStatementTagScoreFor(statementId, tagId, scoreType, job.startedAt, job.id)
      .then( (statementTagScore) => {
        const currentScore = statementTagScore ?
          statementTagScore.score :
          0
        const newScore = currentScore + voteSum
        return this.statementTagScoresDao.createStatementTagScore(statementId, tagId, scoreType, newScore,
          job.startedAt, job.id)
      })
      .then( (statementTagScore) => {
        const diffSign = voteSum >= 0 ? '+' : ''
        this.logger.debug(`Updated statement ${statementTagScore.statementId} / tag ${statementTagScore.tagId}'s score to ${statementTagScore.score} (${diffSign}${voteSum})`)
        return statementTagScore
      })
  }
}

function sumVotesByStatementIdByTagId(votes, logger) {
  const voteSumByStatementIdByTagId = {}
  forEach(votes, (vote) => {
    const tagId = vote.tag.id
    let sumByStatementId = voteSumByStatementIdByTagId[tagId]
    if (isUndefined(sumByStatementId)) {
      sumByStatementId = voteSumByStatementIdByTagId[tagId] = {}
    }
    const statementId = vote.statement.id
    let sum = sumByStatementId[statementId]
    if (isUndefined(sum)) {
      sum = 0
    }

    switch (vote.polarity) {
      case StatementTagVotePolarity.POSITIVE:
        sum += vote.deleted ? -1 : 1
        break
      case StatementTagVotePolarity.NEGATIVE:
        sum -= vote.deleted ? 1 : -1
        break
      default:
        logger.error(`Unknown StatementTagVotePolarity "${vote.polarity} in vote ID ${vote.id}`)
        break
    }

    sumByStatementId[statementId] = sum
  })

  return voteSumByStatementIdByTagId
}