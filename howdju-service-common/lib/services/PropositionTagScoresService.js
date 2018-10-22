const Promise = require('bluebird')
const forEach = require('lodash/forEach')
const flatMap = require('lodash/flatMap')
const isUndefined = require('lodash/isUndefined')
const map = require('lodash/map')

const {
  PropositionTagVotePolarity,
  PropositionTagScoreType,
  JobHistoryStatus,
  utcNow,
} = require('howdju-common')

const {
  JobTypes,
  JobScopes,
} = require('../jobEnums')

exports.PropositionTagScoresService = class PropositionTagScoresService {

  constructor(logger, propositionTagScoresDao, jobHistoryDao, propositionTagVotesDao) {
    this.logger = logger
    this.propositionTagScoresDao = propositionTagScoresDao
    this.jobHistoryDao = jobHistoryDao
    this.propositionTagVotesDao = propositionTagVotesDao
  }

  setPropositionTagScoresUsingAllVotes() {
    const startedAt = utcNow()
    const jobType = JobTypes.SCORE_PROPOSITION_TAGS_BY_GLOBAL_VOTE_SUM
    return this.jobHistoryDao.createJobHistory(jobType, JobScopes.FULL, startedAt)
      /* eslint-disable indent */
      .then( (job) => Promise.all([
          this.propositionTagVotesDao.readVotes(),
          this.propositionTagScoresDao.deleteScoresForType(PropositionTagScoreType.GLOBAL_VOTE_SUM, job.startedAt, job.id)
        ])
          .then( ([votes, deletions]) => {
            this.logger.info(`Deleted ${deletions.length} scores`)
            this.logger.debug(`Recalculating scores based upon ${votes.length} votes`)
            return votes
          })
          .then( (votes) => this.processVoteScores(job, votes, this.createPropositionTagScore))
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

  updatePropositionTagScoresUsingUnscoredVotes() {
    const startedAt = utcNow()
    this.logger.silly(`Starting updatePropositionTagScoresUsingUnscoredVotes at ${startedAt}`)
    return this.jobHistoryDao.createJobHistory(JobTypes.SCORE_PROPOSITION_TAGS_BY_GLOBAL_VOTE_SUM, JobScopes.INCREMENTAL, startedAt)
      /* eslint-disable indent */
      .then( (job) =>
        this.propositionTagScoresDao.readUnscoredVotesForScoreType(PropositionTagScoreType.GLOBAL_VOTE_SUM)
          .then( (votes) => {
            this.logger.debug(`Recalculating scores based upon ${votes.length} votes since last run`)
            return votes
          })
          .then( (votes) => this.processVoteScores(job, votes, this.createSummedPropositionTagScore))
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
    return Promise.resolve(sumVotesByPropositionIdByTagId(votes, this.logger))
      .then( (voteSumByPropositionIdByTagId) =>
        Promise.all(flatMap(voteSumByPropositionIdByTagId, (voteSumByPropositionId, tagId) => map(voteSumByPropositionId, (voteSum, propositionId) =>
            processVote.call(this, propositionId, tagId, voteSum, job)
        )))
      )
  }

  createPropositionTagScore(propositionId, tagId, score, job) {
    const scoreType = PropositionTagScoreType.GLOBAL_VOTE_SUM
    return this.propositionTagScoresDao.createPropositionTagScore(propositionId, tagId, scoreType, score, job.startedAt, job.id)
      .then( (propositionTagScore) => {
        this.logger.debug(`Set proposition ${propositionTagScore.propositionId} / tag ${propositionTagScore.tagId}'s score to ${propositionTagScore.score}`)
        return propositionTagScore
      })
  }

  createSummedPropositionTagScore(propositionId, tagId, voteSum, job) {
    const scoreType = PropositionTagScoreType.GLOBAL_VOTE_SUM
    return this.propositionTagScoresDao.deletePropositionTagScoreFor(propositionId, tagId, scoreType, job.startedAt, job.id)
      .then( (propositionTagScore) => {
        const currentScore = propositionTagScore ?
          propositionTagScore.score :
          0
        const newScore = currentScore + voteSum
        return this.propositionTagScoresDao.createPropositionTagScore(propositionId, tagId, scoreType, newScore,
          job.startedAt, job.id)
      })
      .then( (propositionTagScore) => {
        const diffSign = voteSum >= 0 ? '+' : ''
        this.logger.debug(`Updated proposition ${propositionTagScore.propositionId} / tag ${propositionTagScore.tagId}'s score to ${propositionTagScore.score} (${diffSign}${voteSum})`)
        return propositionTagScore
      })
  }
}

function sumVotesByPropositionIdByTagId(votes, logger) {
  const voteSumByPropositionIdByTagId = {}
  forEach(votes, (vote) => {
    const tagId = vote.tag.id
    let sumByPropositionId = voteSumByPropositionIdByTagId[tagId]
    if (isUndefined(sumByPropositionId)) {
      sumByPropositionId = voteSumByPropositionIdByTagId[tagId] = {}
    }
    const propositionId = vote.proposition.id
    let sum = sumByPropositionId[propositionId]
    if (isUndefined(sum)) {
      sum = 0
    }

    switch (vote.polarity) {
      case PropositionTagVotePolarity.POSITIVE:
        sum += vote.deleted ? -1 : 1
        break
      case PropositionTagVotePolarity.NEGATIVE:
        sum -= vote.deleted ? 1 : -1
        break
      default:
        logger.error(`Unknown PropositionTagVotePolarity "${vote.polarity} in vote ID ${vote.id}`)
        break
    }

    sumByPropositionId[propositionId] = sum
  })

  return voteSumByPropositionIdByTagId
}