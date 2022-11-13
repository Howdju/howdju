const Promise = require('bluebird')
const moment = require('moment')

const concat = require('lodash/concat')
const filter = require('lodash/filter')
const get = require('lodash/get')
const has = require('lodash/has')
const keys = require('lodash/keys')
const map = require('lodash/map')
const merge = require('lodash/merge')
const pickBy = require('lodash/pickBy')
const reduce = require('lodash/reduce')
const reject = require('lodash/reject')
const some = require('lodash/some')
const toNumber = require('lodash/toNumber')
const unionBy = require('lodash/unionBy')
const unzip = require('lodash/unzip')

const {
  EntityTypes,
  SortDirections,
  userActionsConflictCodes,
  entityConflictCodes,
  authorizationErrorCodes,
  ActionTypes,
  ActionTargetTypes,
  requireArgs,
  PropositionTagVotePolarities,
  makePropositionTagVote,
  tagEqual,
} = require('howdju-common')

const {
  PropositionValidator,
} = require('../validators')
const {
  permissions,
} = require('../permissions')
const {
  createContinuationToken,
  decodeContinuationToken,
  createNextContinuationToken,
} = require('./pagination')
const {
  EntityNotFoundError,
  RequestValidationError,
  EntityValidationError,
  EntityConflictError,
  UserActionsConflictError,
  AuthorizationError,
  EntityTooOldToModifyError,
} = require('../serviceErrors')

const emptyPropositionsByVotePolarity = {
  [PropositionTagVotePolarities.POSITIVE]: [],
  [PropositionTagVotePolarities.NEGATIVE]: [],
}

exports.PropositionsService = class PropositionsService {

  constructor(
    config,
    propositionValidator,
    actionsService,
    authService,
    propositionTagsService,
    propositionTagVotesService,
    tagsService,
    propositionsDao,
    permissionsDao,
    justificationsDao
  ) {
    requireArgs({
      config,
      propositionValidator,
      actionsService,
      authService,
      propositionTagsService,
      propositionTagVotesService,
      tagsService,
      propositionsDao,
      permissionsDao,
      justificationsDao,
    })

    this.config = config
    this.propositionValidator = propositionValidator
    this.actionsService = actionsService
    this.authService = authService
    this.propositionTagsService = propositionTagsService
    this.propositionTagVotesService = propositionTagVotesService
    this.tagsService = tagsService
    this.propositionsDao = propositionsDao
    this.permissionsDao = permissionsDao
    this.justificationsDao = justificationsDao
  }

  readPropositionForId(propositionId, {userId, authToken}) {
    return Promise.resolve()
      .then(() => userId || this.authService.readOptionalUserIdForAuthToken(authToken))
      .then((userId) => Promise.all([
        this.propositionsDao.readPropositionForId(propositionId),
        this.propositionTagsService.readTagsForPropositionId(propositionId),
        this.propositionTagsService.readRecommendedTagsForPropositionId(propositionId),
        userId && this.propositionTagVotesService.readVotesForPropositionIdAsUser(userId, propositionId),
      ]))
      .then(([proposition, tags, recommendedTags, propositionTagVotes]) => {
        if (!proposition) {
          throw new EntityNotFoundError(EntityTypes.PROPOSITION, propositionId)
        }
        // Ensure recommended tags also appear in full tags
        proposition.tags = unionBy(tags, recommendedTags, tag => tag.id)
        proposition.recommendedTags = recommendedTags
        if (propositionTagVotes) {
          // Include only votes for present tags
          proposition.propositionTagVotes = filter(propositionTagVotes, vote => some(proposition.tags, tag => tagEqual(tag, vote.tag)))
        }
        return proposition
      })
  }

  readPropositions({sorts, continuationToken = null, count = 25}) {
    const countNumber = toNumber(count)
    if (!isFinite(countNumber)) {
      throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
    }

    if (!continuationToken) {
      return this.readInitialPropositions(sorts, countNumber)
    }
    return this.readMorePropositions(continuationToken, countNumber)
  }

  readPropositionsForIds(propositionsIds) {
    return this.propositionsDao.readPropositionsForIds(propositionsIds)
  }

  readInitialPropositions(requestedSorts, count) {
    const disambiguationSorts = [{property: 'id', direction: SortDirections.ASCENDING}]
    const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
    return this.propositionsDao.readPropositions(unambiguousSorts, count)
      .then(propositions => {
        const continuationToken = createContinuationToken(unambiguousSorts, propositions)
        return {
          propositions,
          continuationToken,
        }
      })
  }

  readMorePropositions(continuationToken, count) {
    const {
      sorts,
      filters,
    } = decodeContinuationToken(continuationToken)
    return this.propositionsDao.readMorePropositions(sorts, count)
      .then(propositions => {
        const nextContinuationToken = createNextContinuationToken(sorts, propositions, filters) || continuationToken
        return {
          propositions,
          continuationToken: nextContinuationToken,
        }
      })
  }

  updateProposition(authToken, proposition) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const validationErrors = this.propositionValidator.validate(proposition)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError({proposition: validationErrors})
        }
        return userId
      })
      .then(userId => Promise.all([
        userId,
        this.propositionsDao.countEquivalentPropositions(proposition),
        Promise.props({
          [userActionsConflictCodes.OTHER_USERS_HAVE_ROOTED_JUSTIFICATIONS_IN_THIS_PROPOSITION]:
            this.propositionsDao.hasOtherUsersRootedJustifications(proposition, userId),
          [userActionsConflictCodes.OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_ROOTED_IN_THIS_PROPOSITION]:
            this.propositionsDao.hasOtherUsersRootedJustificationsVotes(proposition, userId),
          [userActionsConflictCodes.OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_PROPOSITION]:
            this.propositionsDao.isBasisToOtherUsersJustifications(proposition, userId),
        }),
        this.permissionsDao.userHasPermission(userId, permissions.EDIT_ANY_ENTITY),
      ]))
      .then(([
        userId,
        equivalentPropositionsCount,
        userActionConflicts,
        hasPermission,
      ]) => {
        if (equivalentPropositionsCount > 0) {
          throw new EntityConflictError(merge(
            PropositionValidator.blankErrors(),
            {
              hasErrors: true,
              fieldErrors: {
                text: [entityConflictCodes.ANOTHER_PROPOSITION_HAS_EQUIVALENT_TEXT],
              },
            }
          ))
        } else if (!hasPermission) {
          const userActionConflictCodes = keys(pickBy(userActionConflicts))
          if (userActionConflictCodes.length > 0) {
            throw new UserActionsConflictError(merge(
              PropositionValidator.blankErrors(),
              {
                hasErrors: true,
                modelErrors: userActionConflictCodes,
              }
            ))
          }
        }
        return userId
      })
      .then(userId => {
        const now = new Date()
        return Promise.all([
          userId,
          now,
          this.propositionsDao.updateProposition(proposition),
        ])
      })
      .then(([userId, now, updatedProposition]) => {
        if (!updatedProposition) {
          throw new EntityNotFoundError(EntityTypes.PROPOSITION, proposition.id)
        }

        this.actionsService.asyncRecordAction(userId, now, ActionTypes.UPDATE, ActionTargetTypes.PROPOSITION, updatedProposition.id)
        return updatedProposition
      })
  }

  deleteProposition(authToken, propositionId) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => Promise.all([
        userId,
        this.permissionsDao.userHasPermission(userId, permissions.EDIT_ANY_ENTITY),
        this.justificationsDao.readJustificationsDependentUponPropositionId(propositionId),
        this.propositionsDao.readPropositionForId(propositionId),
      ]))
      .then(([userId, hasPermission, dependentJustifications, proposition]) => {
        const now = new Date()
        const result = [userId, now, proposition, dependentJustifications]

        if (!proposition) {
          throw new EntityNotFoundError(EntityTypes.PROPOSITION, propositionId)
        }
        if (hasPermission) {
          return result
        }
        const creatorUserId = get(proposition, 'creator.id')
        if (!creatorUserId || userId !== creatorUserId) {
          throw new AuthorizationError({modelErrors: [authorizationErrorCodes.CANNOT_MODIFY_OTHER_USERS_ENTITIES]})
        }

        const created = moment(proposition.created)
        const graceCutoff = created.clone()
        graceCutoff.add(this.config.modifyEntityGracePeriod)
        const nowMoment = moment(now)
        if (nowMoment.isAfter(graceCutoff)) {
          throw new EntityTooOldToModifyError(this.config.modifyEntityGracePeriod)
        }

        const otherUsersJustificationsDependentUponProposition = filter(dependentJustifications, j => get(j, 'creator.id') !== userId)
        if (otherUsersJustificationsDependentUponProposition.length > 0) {
          throw new UserActionsConflictError()
        }

        return result
      })
      .then(([userId, now, proposition, dependentJustifications]) => Promise.all([
        userId,
        now,
        this.propositionsDao.deleteProposition(proposition, now),
        this.justificationsDao.deleteJustifications(dependentJustifications, now),
      ]))
      .then(([userId, now, deletedPropositionId, deletedJustificationIds]) => Promise.all([
        deletedPropositionId,
        deletedJustificationIds,
        this.actionsService.asyncRecordAction(userId, now, ActionTypes.DELETE, ActionTargetTypes.PROPOSITION, deletedPropositionId),
        Promise.all(map(deletedJustificationIds, id =>
          this.actionsService.asyncRecordAction(userId, now, ActionTypes.DELETE, ActionTargetTypes.JUSTIFICATION, id))),
      ]))
      .then(([deletedPropositionId, deletedJustificationIds]) => ({
        deletedPropositionId,
        deletedJustificationIds,
      }))
  }

  readOrCreateProposition(authToken, proposition) {
    return this.authService.readUserIdForAuthToken(authToken)
      .then(userId => {
        const now = new Date()
        return this.readOrCreatePropositionAsUser(proposition, userId, now)
      })
  }

  readOrCreatePropositionAsUser(proposition, userId, now) {
    return Promise.resolve()
      .then(() => {
        const validationErrors = this.propositionValidator.validate(proposition)
        if (validationErrors.hasErrors) {
          throw new EntityValidationError(validationErrors)
        }
        return userId
      })
      .then(userId => this.readOrCreateValidPropositionAsUser(proposition, userId, now))
  }

  readOrCreateValidPropositionAsUser(proposition, userId, now) {
    return Promise.resolve()
      .then(() => {
        if (proposition.id) {
          return Promise.props({
            isExtant: true,
            proposition: this.readPropositionForId(proposition.id, {userId}),
          })
        }

        return readOrCreateEquivalentValidPropositionAsUser(this, proposition, userId, now)
      })
      .then((wrapper) => {
        if (proposition.tags) {
          // When creating a proposition, assume all tags are also votes.
          // (Anti-votes don't make any sense, because anti-votes are votes against tags recommended by the system
          //  based upon other users' activity.  But new propositions don't have other user activity, and so have no
          //  recommended tags against which to vote)
          //
          // TODO(1,2,3): remove exception
          // eslint-disable-next-line promise/no-nesting
          return readOrCreateTagsAndVotes(this, userId, wrapper.proposition.id, proposition.tags, now)
            .then(([tags, propositionTagVotes]) => {
              wrapper.proposition.tags = tags
              proposition.propositionTagVotes = propositionTagVotes
              return wrapper
            })
        }
        return wrapper
      })
  }

  readPropositionsForTagId(tagId, {userId, authToken}) {
    return Promise.resolve()
      .then(() => userId || this.authService.readOptionalUserIdForAuthToken(authToken))
      .then((userId) => Promise.all([
        this.propositionTagsService.readPropositionsRecommendedForTagId(tagId),
        userId ? this.propositionTagsService.readTaggedPropositionsByVotePolarityAsUser(userId, tagId) : emptyPropositionsByVotePolarity,
      ]))
      .then(([recommendedPropositions, userTaggedPropositionsByVotePolarity]) => {
        const {
          [PropositionTagVotePolarities.POSITIVE]: taggedPositivePropositions,
          [PropositionTagVotePolarities.NEGATIVE]: taggedNegativePropositions,
        } = userTaggedPropositionsByVotePolarity

        const taggedNegativePropositionIds = reduce(taggedNegativePropositions, (acc, s, id) => {
          acc[id] = true
        }, {})
        const prunedRecommendedPropositions = reject(recommendedPropositions, rs => has(taggedNegativePropositionIds, rs.id))
        const propositions = unionBy(taggedPositivePropositions, prunedRecommendedPropositions, s => s.id)

        return propositions
      })
  }
}

function readOrCreateEquivalentValidPropositionAsUser(service, proposition, userId, now) {
  return Promise.resolve()
    .then(() => Promise.all([
      userId,
      service.propositionsDao.readPropositionByText(proposition.text),
      now,
    ]))
    .then(([userId, extantProposition, now]) => {
      const isExtant = !!extantProposition
      return Promise.all([
        userId,
        now,
        isExtant,
        isExtant ? extantProposition : service.propositionsDao.createProposition(userId, proposition, now),
      ])
    })
    .then(([userId, now, isExtant, proposition]) => {
      const actionType = isExtant ? ActionTypes.TRY_CREATE_DUPLICATE : ActionTypes.CREATE
      service.actionsService.asyncRecordAction(userId, now, actionType, ActionTargetTypes.PROPOSITION, proposition.id)

      return {
        isExtant,
        proposition,
      }
    })
}

function readOrCreateTagsAndVotes(service, userId, propositionId, tags, now) {
  return Promise.all(map(tags, tag =>
    service.tagsService.readOrCreateValidTagAsUser(userId, tag, now)
      .then((tag) => {
        const propositionTagVote = makePropositionTagVote({
          proposition: {id: propositionId},
          tag,
          polarity: PropositionTagVotePolarities.POSITIVE,
        })
        return Promise.all([
          tag,
          service.propositionTagVotesService.readOrCreatePropositionTagVoteAsUser(userId, propositionTagVote, now),
        ])
      })
  ))
    // Split the tags and votes
    .then((tagAndVotes) => unzip(tagAndVotes))
}
