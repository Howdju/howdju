const argon2 = require('argon2')
const cryptohat = require('cryptohat')
const uuid = require('uuid')
const moment = require('moment')
const Promise = require('bluebird')
const merge = require('lodash/merge')
const assign = require('lodash/assign')
const forEach = require('lodash/forEach')
const cloneDeep = require('lodash/cloneDeep')
const filter = require('lodash/filter')
const keys = require('lodash/keys')
const pickBy = require('lodash/pickBy')
const map = require('lodash/map')
const toNumber = require('lodash/toNumber')
const differenceBy = require('lodash/differenceBy')
const find = require('lodash/find')
const values = require('lodash/values')
const findIndex = require('lodash/findIndex')
const groupBy = require('lodash/groupBy')
const sortBy = require('lodash/sortBy')

const config = require('./config')
const {logger} = require('./logger')
const statementsDao = require('./dao/statementsDao')
const permissionsDao = require('./dao/permissionsDao')
const citationReferencesDao = require('./dao/citationReferencesDao')
const citationsDao = require('./dao/citationsDao')
const justificationsDao = require('./dao/justificationsDao')
const usersDao = require('./dao/usersDao')
const authDao = require('./dao/authDao')
const votesDao = require('./dao/votesDao')
const urlsDao = require('./dao/urlsDao')
const actionsDao = require('./dao/actionsDao')
const {
  statementValidator,
  justificationValidator,
  credentialValidator,
  userValidator,
  voteValidator,
  citationReferenceValidator,
} = require('./validators')
const {
  OTHER_CITATION_REFERENCES_HAVE_SAME_QUOTE_CONFLICT,
  OTHER_CITATIONS_HAVE_SAME_TEXT_CONFLICT,
} = require("./codes/entityConflictCodes")
const {
  OTHER_USERS_HAVE_VERIFIED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_REFERENCE_CONFLICT,
  OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_USING_THIS_CITATION_REFERENCE_CONFLICT,
  OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_REFERENCE_CONFLICT,
  OTHER_USERS_HAVE_VERIFIED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_CONFLICT,
  OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_USING_THIS_CITATION_CONFLICT,
  OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_CONFLICT,
} = require("./codes/userActionsConflictCodes")
const {
  CANNOT_MODIFY_OTHER_USERS_ENTITIES
} = require('./codes/authorizationErrorCodes')
const {
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  EntityConflictError,
  ValidationError,
  UserActionsConflictError,
  ImpossibleError,
  EntityTooOldToModifyError,
} = require("./errors")
const {
  CREATE_USERS,
  EDIT_ANY_ENTITY,
} = require("./permissions")
const {
  JustificationTargetType,
  JustificationBasisType,
  ActionTargetType,
  ActionSubjectType,
  ActionType,
  EntityTypes,
} = require('./models')


const withPermission = (authToken, permission) => permissionsDao.getUserIdWithPermission(authToken, permission)
    .then( ({userId, hasPermission}) => {
      if (!userId) {
        throw new AuthenticationError()
      }
      if (!hasPermission) {
        throw new AuthorizationError(permission)
      }
      return toNumber(userId)
    })

const withAuth = (authToken) => permissionsDao.getUserId(authToken).then(userId => {
  if (!userId) {
    throw new AuthenticationError()
  }
  return toNumber(userId)
})

const readStatements = () => statementsDao.readStatements()

const readStatement = ({statementId, authToken}) => statementsDao.readStatementById(statementId)
    .then(statement => {
      if (!statement) {
        throw new NotFoundError(EntityTypes.STATEMENT, statementId)
      }
      return statement
    })

const readStatementJustifications = ({statementId, authToken}) => Promise.resolve([
    toNumber(statementId),
    authToken,
])
    .then( ([statementId, authToken]) => Promise.all([
        statementsDao.readStatementById(statementId),
        justificationsDao.readJustificationsAndVotesByRootStatementId(authToken, statementId),
    ]))
        .then( ([statement, justifications]) => {
          if (!statement) {
            throw new NotFoundError(EntityTypes.STATEMENT, statementId)
          }
          return {
            statement,
            justifications,
          }
        })

const createUser = ({user, authToken}) => withPermission(authToken, CREATE_USERS)
    .then(creatorUserId => {
      const validationErrors = userValidator.validate(user)
      if (validationErrors.hasErrors) {
        throw new ValidationError(({user: validationErrors}))
      }
      return creatorUserId
    })
    .then(creatorUserId => Promise.all([
        creatorUserId,
        argon2.generateSalt().then(salt => argon2.hash(user.password, salt)),
        new Date(),
    ]))
    .then( ([creatorUserId, hash, now]) =>
        usersDao.createUser(user, hash, creatorUserId, now)
            .then(asyncRecordEntityAction(creatorUserId, ActionType.CREATE, ActionTargetType.USER, now))
    )

const login = ({credentials}) => Promise.resolve()
    .then(() => {
      const validationErrors = credentialValidator.validate(credentials)
      if (validationErrors.hasErrors) {
        throw new ValidationError({credentials: validationErrors})
      }
      return credentials
    })
    .then(credentials => Promise.all([
        credentials,
        usersDao.readAuthUserByEmail(credentials.email),
    ]))
    .then( ([credentials, user]) => {
      if (!user) {
        throw new NotFoundError(EntityTypes.USER, credentials.email)
      }
      return Promise.all([
          user,
          argon2.verify(hash, credentials.password),
      ])
    })
    .then( ([user, isMatch]) => {
      if (!isMatch) {
        throw new AuthenticationError()
      }
      const authToken = cryptohat(256, 36)
      const created = new Date()
      const expires = moment().add(moment.duration.apply(moment.duration, config.authTokenDuration)).toDate()

      return Promise.all([
          user,
          authToken,
          authDao.insertAuthToken(user.id, authToken, created, expires)
      ])
    })
    .then( ([user, authToken]) => ({
      email: user.email,
      authToken,
      // ignore insertion result, so long as it succeeded
    }))

const logout = ({authToken}) => authDao.deleteAuthToken(authToken)

const createVote = ({authToken, vote}) => withAuth(authToken)
    .then(userId => {
      const validationErrors = voteValidator.validate(vote)
      if (validationErrors.hasErrors) {
        throw new ValidationError({vote: validationErrors})
      }
      return userId
    })
    .then(userId => Promise.all([
        userId,
        votesDao.deleteOpposingVotes(userId, vote),
        votesDao.readEquivalentVotes(userId, vote),
    ]))
    .then( ([userId, updatedOpposingVoteIds, equivalentVotes]) => {
      if (updatedOpposingVoteIds.length > 0) {
        logger.debug(`Deleted ${updatedOpposingVoteIds.length} opposing votes`, vote)
      }
      if (equivalentVotes.length > 0) {
        if (equivalentVotes.length > 1) {
          logger.error(`${equivalentVotes.length} equivalent votes exist`, equivalentVotes, vote)
        }
        const equivalentVote = equivalentVotes[0]
        logger.debug('Equivalent vote already exists', equivalentVote, vote)
        return equivalentVote
      } else {
        return votesDao.createVote(userId, vote)
      }
    })
    .then(vote => ({vote}))

const deleteVote = ({authToken, vote}) => withAuth(authToken)
    .then(userId => {
      const validationErrors = voteValidator.validate(vote)
      if (validationErrors.hasErrors) {
        throw new ValidationError({vote: validationErrors})
      }
      return userId
    })
    .then(userId => votesDao.deleteEquivalentVotes(userId, vote))
    .then(deletedVoteIds => {
      if (deletedVoteIds.length === 0) {
        logger.debug('No votes to unvote')
        throw new NotFoundError()
      } else if (deletedVoteIds.length > 1) {
        logger.warn(`Deleted ${deletedVoteIds.length} votes at once!`)
      }
      return deletedVoteIds
    })

const updateStatement = ({authToken, statement}) => withAuth(authToken)
    .then(userId => {
      const validationErrors = statementValidator.validate(statement)
      if (validationErrors.hasErrors) {
        throw new ValidationError({statement: validationErrors})
      }
      return userId
    })
    .then(userId => Promise.all([
      userId,
      statementsDao.countOtherStatementsHavingSameTextAs(statement),
      statementsDao.hasOtherUserInteractions(userId, statement),
      permissionsDao.userHasPermission(userId, EDIT_ANY_ENTITY)
    ]))
    .then( ([
        userId,
        otherStatementsHavingSameTextCount,
        hasOtherUserInteractions,
        hasPermission,
      ]) => {
      if (otherStatementsHavingSameTextCount > 0) {
        throw new EntityConflictError([OTHER_CITATIONS_HAVE_SAME_TEXT_CONFLICT])
      } else if (hasOtherUserInteractions && !hasPermission) {
        const conflictCodes = []
        throw new UserActionsConflictError(conflictCodes)
      }
      return userId
    })
    .then(userId => {
      const now = new Date()
      return Promise.all([
        userId,
        now,
        statementsDao.updateStatement(statement)
      ])
    })
    .then( ([userId, now, updatedStatement]) => {
      if (!updatedStatement) {
        throw new NotFoundError(EntityTypes.STATEMENT, statement.id)
      }

      asyncRecordAction(userId, ActionType.UPDATE, ActionTargetType.STATEMENT, now, updatedStatement.id)
      return updatedStatement
    })

const readCitationReference = ({authToken, citationReferenceId}) => citationReferencesDao.read(citationReferenceId)

const diffUrls = citationReference => Promise.resolve()
    .then(() => citationReferencesDao.readUrlsByCitationReferenceId(citationReference.id))
    .then(extantUrls => {
      const addedUrls = differenceBy(citationReference.urls, [extantUrls], url => url.url)
      const removedUrls = differenceBy(extantUrls, [citationReference.urls], url => url.url)
      const haveChanged = addedUrls.length > 0 || removedUrls.length > 0
      return {
        addedUrls,
        removedUrls,
        haveChanged
      }
    })

const updateCitationReference = ({authToken, citationReference}) => withAuth(authToken)
    .then(userId => {
      const validationErrors = citationReferenceValidator.validate(citationReference)
      if (validationErrors.hasErrors) {
        throw new ValidationError({citationReference: validationErrors})
      }
      return userId
    })
    .then(userId => Promise.all([
      userId,
      citationReferencesDao.hasCitationReferenceChanged(citationReference),
      citationsDao.hasCitationChanged(citationReference.citation),
      diffUrls(citationReference),
    ]))
    .then( ([
        userId,
        citationReferenceHasChanged,
        citationHasChanged,
        urlDiffs,
    ]) => {
      if (!citationReferenceHasChanged && !citationHasChanged && !urlDiffs.haveChanged) {
        return citationReference
      }

      const entityConflicts = {}
      const userActionConflicts = {}
      if (citationReferenceHasChanged) {
        entityConflicts[OTHER_CITATION_REFERENCES_HAVE_SAME_QUOTE_CONFLICT] =
            citationReferencesDao.doOtherCitationReferencesHaveSameQuoteAs(citationReference)
        assign(userActionConflicts, {
          [OTHER_USERS_HAVE_VERIFIED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_REFERENCE_CONFLICT]:
              citationReferencesDao.isBasisToJustificationsHavingOtherUsersVotes(userId, citationReference),
          [OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_USING_THIS_CITATION_REFERENCE_CONFLICT]:
              citationReferencesDao.isBasisToOtherUsersJustifications(userId, citationReference),
          [OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_REFERENCE_CONFLICT]:
              citationReferencesDao.isBasisToJustificationsHavingOtherUsersCounters(userId, citationReference),
        })
      }
      if (citationHasChanged) {
        const citation = citationReference.citation

        entityConflicts[OTHER_CITATIONS_HAVE_SAME_TEXT_CONFLICT] = citationsDao.doOtherCitationsHaveSameTextAs(citation)

        assign(userActionConflicts, {
          [OTHER_USERS_HAVE_VERIFIED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_CONFLICT]:
              citationsDao.isCitationOfBasisToOtherUsersJustifications(userId, citation),
          [OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_USING_THIS_CITATION_CONFLICT]:
              citationsDao.isCitationOfBasisToJustificationsHavingOtherUsersVotes(userId, citation),
          [OTHER_USERS_HAVE_COUNTERED_JUSTIFICATIONS_BASED_ON_THIS_CITATION_CONFLICT]:
              citationsDao.isCitationOfBasisToJustificationsHavingOtherUsersCounters(userId, citation),
        })
      }
      if (urlDiffs.haveChanged) {
        // When URLs are votable, ensure that no one has voted them (or at least up-voted them) before deleting
        // Adding should always be okay
      }

      return Promise.props({
        userId,
        now: new Date(),
        citationReferenceHasChanged,
        citationHasChanged,
        urlDiffs,
        hasPermission: permissionsDao.userHasPermission(userId, EDIT_ANY_ENTITY),
        entityConflicts: Promise.props(entityConflicts),
        userActionConflicts: Promise.props(userActionConflicts)
      })
    })
    .then( ({
              userId,
              now,
              hasPermission,
              entityConflicts,
              userActionConflicts,
              citationReferenceHasChanged,
              citationHasChanged,
              urlDiffs,
    }) => {

      const entityConflictCodes = keys(pickBy(entityConflicts))
      if (entityConflictCodes.length > 0) throw new EntityConflictError(entityConflictCodes)

      const userActionsConflictCodes = keys(pickBy(userActionConflicts))
      if (userActionsConflictCodes.length > 0) {
        if (!hasPermission) {
          throw new UserActionsConflictError(userActionsConflictCodes)
        }
        logger.info(`User ${userId} overriding userActionsConflictCodes ${userActionsConflictCodes}`)
      }

      return {userId, now, citationReferenceHasChanged, citationHasChanged, urlDiffs}
    })
    .then( ({userId, now, citationReferenceHasChanged, citationHasChanged, urlDiffs}) => Promise.all([
        userId,
        now,
        citationReferenceHasChanged ?
            citationReferencesDao.updateCitationReference(citationReference)
                .then(asyncRecordEntityAction(userId, ActionType.UPDATE, ActionTargetType.CITATION_REFERENCE, now)) :
            citationReference,
        citationHasChanged ?
            citationsDao.update(citationReference.citation)
                .then(asyncRecordEntityAction(userId, ActionType.UPDATE, ActionTargetType.CITATION, now)) :
            citationReference.citation,
        urlDiffs.haveChanged ?
            updateCitationReferenceUrls(citationReference, userId, now) :
            citationReference.urls
    ]))
    .then( ([userId, now, citationReference, citation, urls]) => {
      if (citationReference.citation !== citation) {
        citationReference = assign({}, citationReference, {citation})
      }
      if (citationReference.urls !== urls) {
        citationReference = assign({}, citationReference, {urls})
      }

      return citationReference
    })

const updateCitationReferenceUrls = (citationReference, userId, now) => Promise.resolve()
    .then(() => {
      // deduplicate URLs, giving preference to those having IDs
      const urlByUrl = {}
      forEach(citationReference.urls, url => {
        const previousUrl = urlByUrl[url.url]
        if (!previousUrl || !previousUrl.id) {
          urlByUrl[url.url] = url
        }
      })
      return values(urlByUrl)
    })
    .then(dedupedUrls => groupBy(dedupedUrls, u => u.id ? 'hasId' : 'noId'))
    .then( ({'hasId': extantUrls, 'noId': newUrls}) => Promise.all([
      extantUrls || [],
      newUrls ? createUrls(newUrls, userId, now) : [],
    ]))
    .then( ([extantUrls, createdUrls]) => Promise.all([
      citationReferencesDao.readUrlsByCitationReferenceId(citationReference.id),
      extantUrls.concat(createdUrls),
    ]))
    .then( ([currentUrls, updatedUrls]) => ({
      updatedUrls,
      addedUrls: differenceBy(updatedUrls, currentUrls, url => url.url),
      removedUrls: differenceBy(currentUrls, updatedUrls, url => url.url),
    }))
    .then( ({updatedUrls, addedUrls, removedUrls}) => Promise.all([
      updatedUrls,
      addedUrls.length > 0 ? citationReferencesDao.createCitationReferenceUrls(citationReference, addedUrls, userId, now) : addedUrls,
      removedUrls.length > 0 ? citationReferencesDao.deleteCitationReferenceUrls(citationReference, removedUrls, now) : removedUrls,
    ]))
    .then( ([updatedUrls, createdCitationReferenceUrls, deletedCitationReferenceUrls]) => {
      map(createdCitationReferenceUrls, citationReferenceUrl => asyncRecordAction(userId, ActionType.ASSOCIATE,
          ActionTargetType.CITATION_REFERENCE, now, citationReferenceUrl.citationReferenceId, ActionSubjectType.URL, citationReferenceUrl.urlId))
      map(deletedCitationReferenceUrls, citationReferenceUrl => asyncRecordAction(userId, ActionType.DISASSOCIATE,
          ActionTargetType.CITATION_REFERENCE, now, citationReferenceUrl.citationReferenceId, ActionSubjectType.URL, citationReferenceUrl.urlId))
      return updatedUrls
    })
    .then(updatedUrls => sortBy(updatedUrls, url => url.url))

const deleteStatement = ({authToken, statementId}) => withAuth(authToken)
    .then(userId => Promise.all([
        userId,
        permissionsDao.userHasPermission(userId, EDIT_ANY_ENTITY),
        justificationsDao.readJustificationsDependentUponStatementId(statementId),
        statementsDao.readStatementById(statementId),
    ]))
    .then( ([userId, hasPermission, dependentJustifications, statement]) => {
      if (!statement) {
        throw new NotFoundError(EntityTypes.STATEMENT, statementId)
      }
      if (hasPermission) {
        return [userId, statement, dependentJustifications]
      }
      if (userId !== statement.creatorUserId) {
        throw new AuthorizationError([CANNOT_MODIFY_OTHER_USERS_ENTITIES])
      }

      const created = moment(statement.created)
      const graceCutoff = created.add.apply(created, config.modifyEntityGracePeriod)
      const now = new Date()
      const nowMoment = moment(now)
      if (nowMoment.isAfter(graceCutoff)) {
        throw new EntityTooOldToModifyError(config.modifyEntityGracePeriod)
      }

      const otherUsersJustificationsDependentUponStatement = filter(dependentJustifications, j => j.creatorUserId !== userId)
      if (otherUsersJustificationsDependentUponStatement.length > 0) {
        throw new UserActionsConflictError()
      }
      return [userId, now, statement, dependentJustifications]
    })
    .then( ([userId, now, statement, dependentJustifications]) => Promise.all([
      userId,
      now,
      statementsDao.deleteStatement(statement, now),
      justificationsDao.deleteJustifications(dependentJustifications, now),
    ]))
    .then( ([userId, now, deletedStatementId, deletedJustificationIds]) => Promise.all([
      deletedStatementId,
      deletedJustificationIds,
      asyncRecordAction(userId, ActionType.DELETE, ActionTargetType.STATEMENT, now, statementId),
      Promise.all(map(deletedJustificationIds, id => asyncRecordAction(userId, ActionType.DELETE, ActionTargetType.JUSTIFICATION, id)))
    ]))
    .then( ([deletedStatementId, deletedJustificationIds]) => ({
      deletedStatementId,
      deletedJustificationIds,
    }))

const createJustification = ({authToken, justification}) => withAuth(authToken)
    .then(userId => createJustificationAsUser(justification, userId, new Date()))

const createJustificationAsUser = (justification, userId, now) => Promise.resolve()
    .then(() => {
      if (justification.id) {
        return justification
      }
      return Promise.resolve()
          .then(() => {
            const validationErrors = justificationValidator.validate(justification)
            if (validationErrors.hasErrors) {
              throw new ValidationError({justification: validationErrors})
            }
            return [userId, now]
          })
          .then( ([userId, now]) => createValidJustificationAsUser(justification, userId, now))
    })

const createValidJustificationAsUser = (justification, userId, now) => Promise.all([
      now,
      createJustificationTarget(justification.target, userId, now),
      createJustificationBasis(justification.basis, userId, now),
    ])
    .then( ([now, {targetType, targetEntity}, {basisType, basisEntity}]) => {
      justification = cloneDeep(justification)

      justification.target = {
        type: targetType,
        entity: targetEntity,
      }
      if (targetType === JustificationTargetType.STATEMENT) {
        justification.rootStatementId = targetEntity.id
      }

      justification.basis = {
        type: basisType,
        entity: basisEntity
      }
      return [now, justification]
    })
    .then( ([now, justification]) => Promise.all([
        justification,
        justificationsDao.createJustification(justification, userId, now)
            .then(asyncRecordEntityAction(userId, ActionType.CREATE, ActionTargetType.JUSTIFICATION, now))
    ]))
    // merge in the previous stuff, which might have details about the basis and target
    .then( ([justification, dbJustification]) => merge({}, justification, dbJustification))

const createJustificationTarget = (justificationTarget, userId, now) => {
  switch (justificationTarget.type) {

    case JustificationTargetType.JUSTIFICATION:
      return createJustificationAsUser(justificationTarget.entity, userId, now).then(justification => ({
        targetType: justificationTarget.type,
        targetEntity: justification,
      }))

    case JustificationTargetType.STATEMENT:
      return createStatementAsUser(justificationTarget.entity, userId, now)
          .then(({isExtant, statement}) => ({
            isExtant,
            targetType: justificationTarget.type,
            targetEntity: statement,
          }))

    default:
      throw new ImpossibleError(`Unsupported JustificationBasisType: ${justificationBasis.type}`)
  }
}

const createJustificationBasis = (justificationBasis, userId, now) => {
  switch (justificationBasis.type) {

    case JustificationBasisType.CITATION_REFERENCE:
      return createCitationReference(justificationBasis.entity, userId, now).then(citationReference => ({
        basisType: JustificationBasisType.CITATION_REFERENCE,
        basisEntity: citationReference,
      }))

    case JustificationBasisType.STATEMENT:
      return createStatementAsUser(justificationBasis.entity, userId, now)
          .then(({isExtant, statement}) => ({
            isExtant,
              basisType: JustificationBasisType.STATEMENT,
              basisEntity: statement,
            }))

    default:
      throw new ImpossibleError(`Unsupported JustificationBasisType: ${justificationBasis.type}`)
  }
}

const createCitationReference = (citationReference, userId, now) => Promise.props({
    citation: createCitation(citationReference.citation, userId, now),
    urls: createUrls(citationReference.urls, userId, now),
  })
    .then( ({citation, urls}) => {
      citationReference.citation = citation
      citationReference.urls = urls
      return createJustCitationReference(citationReference, userId, now)
    })
    .then( citationReference => {
      return Promise.props({
        citationReference,
        citationReferenceUrls: createCitationReferenceUrls(citationReference, userId, now)
      })
    })
    .then( ({citationReference}) => citationReference)

const createUrls = (urls, userId, now) => Promise.resolve()
    .then(() => filter(urls, url => url.url))
    .then(nonEmptyUrls => Promise.all(map(nonEmptyUrls, url => createUrl(url, userId, now))))

const createUrl = (url, userId, now) => {
  return urlsDao.readUrlEquivalentTo(url)
      .then( equivalentUrl => {
        if (equivalentUrl) {
          return equivalentUrl
        }
        return urlsDao.createUrl(url, userId, now)
            .then(asyncRecordEntityAction(userId, ActionType.CREATE, ActionTargetType.URL, now))
      })
}

const createJustCitationReference = (citationReference, userId, now) => {
  if (citationReference.id) {
    return citationReference
  }
  return citationReferencesDao.readCitationReferencesEquivalentTo(citationReference)
      .then( equivalentCitationReference => {
        if (equivalentCitationReference) {
          return equivalentCitationReference
        }
        return citationReferencesDao.createCitationReference(citationReference, userId, now)
            .then(asyncRecordEntityAction(userId, ActionType.CREATE, ActionTargetType.CITATION_REFERENCE, now))
            // Merge in related entities such as the citation
            .then(dbCitationReference => merge(citationReference, dbCitationReference))
      })
}

const createCitationReferenceUrls = (citationReference, userId, now) => {
  const urls = citationReference.urls
  return Promise.all(map(urls, url => citationReferencesDao.readCitationReferenceUrl(citationReference.id, url.id)))
      .then( citationReferenceUrls => {
        const associatedUrlIds = {}
        forEach(citationReferenceUrls, citationReferenceUrl => {
          associatedUrlIds[citationReferenceUrl.urlId] = citationReferenceUrl
        })
        return map(urls, url => associatedUrlIds[url.id] ?
            associatedUrlIds[url.id] :
            citationReferencesDao.createCitationReferenceUrl(citationReference, url, userId, now)
        )
      })
}

const createCitation = (citation, userId, now) => Promise.resolve()
    .then(() => {
      if (citation.id) return {
        citation
      }
      return citationsDao.readCitationEquivalentTo(citation)
          .then( equivalentCitation => {
            if (equivalentCitation) {
              return equivalentCitation
            }
            return citationsDao.createCitation(citation, userId, now)
                .then(asyncRecordEntityAction(userId, ActionType.CREATE, ActionTargetType.CITATION, now))
          })
    })

const createStatement = ({authToken, statement}) => withAuth(authToken)
    .then(userId => {
      const validationErrors = statementValidator.validate(statement)
      if (validationErrors.hasErrors) {
        throw new ValidationError({statement: validationErrors})
      }
      return userId
    })
    .then(userId => {
      if (statement.id) {
        return {isExtant: true, statement}
      } else {
        const now = new Date()
        return createStatementAsUser(statement, userId, now)
      }
    })

const createStatementAsUser = (statement, userId, now) => Promise.resolve()
    .then(() => {
      const validationErrors = statementValidator.validate(statement)
      if (validationErrors.hasErrors) {
        throw new ValidationError({statement: validationErrors})
      }
      return userId
    })
    .then(userId => createValidStatementAsUser(statement, userId, now))

const createValidStatementAsUser = (statement, userId, now) => Promise.resolve()
    .then(() => Promise.all([
      userId,
      statementsDao.readStatementByText(statement.text),
      now,
    ]))
    .then( ([userId, extantStatement, now]) => {
      return Promise.all([
        userId,
        now,
        !!extantStatement,
        extantStatement || statementsDao.createStatement(userId, statement, now),
      ])
    })
    .then( ([userId, now, isExtant, statement]) => {
      const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
      asyncRecordAction(userId, actionType, ActionTargetType.STATEMENT, now, statement.id)

      return {
        isExtant,
        statement,
      }
    })

const deleteJustification = ({authToken, justificationId}) => withAuth(authToken)
    .then(userId => Promise.all([
      userId,
      permissionsDao.userHasPermission(userId, EDIT_ANY_ENTITY),
      justificationsDao.readJustificationById(justificationId),
    ]))
    .then( ([userId, hasPermission, justification]) => {
      if (hasPermission) {
        return [userId, justification]
      }

      if (userId !== justification.creatorUserId) {
        throw new AuthorizationError([CANNOT_MODIFY_OTHER_USERS_ENTITIES])
      }

      const created = moment(justification.created)
      const graceCutoff = created.add.apply(created, config.modifyEntityGracePeriod)
      const now = new Date()
      const nowMoment = moment(now)
      if (nowMoment.isAfter(graceCutoff)) {
        throw new EntityTooOldToModifyError(config.modifyEntityGracePeriod)
      }

      return [userId, now, justification]
    })
    .then( ([userId, now, justification]) => Promise.all([
      userId,
      now,
      justificationsDao.deleteJustification(justification, now),
    ]))
    .then( ([userId, now, deletedJustificationId]) => Promise.all([
      deletedJustificationId,
      asyncRecordAction(userId, ActionType.DELETE, ActionTargetType.JUSTIFICATION, now, deletedJustificationId),
    ]))
    .then( ([deletedJustificationId]) => ({
      deletedJustificationId,
    }))

/** Inserts an action record, but returns the entity, so that promises won't block on the query */
const asyncRecordEntityAction = (userId, actionType, actionTargetType, now) => entity => {
  if (entity) {
    asyncRecordAction(userId, actionType, actionTargetType, now, entity.id)
  } else {
    logger.info(`Recorded missing entity action (user ${userId} ${actionType} ${actionTargetType} ${now}`)
  }

  return entity
}

const asyncRecordAction = (userId, actionType, actionTargetType, now, targetEntityId, actionSubjectType, subjectEntityId) => {
  // Don't return promise
  actionsDao.createAction(userId, actionType, targetEntityId, actionTargetType, now, actionSubjectType, subjectEntityId)
}

module.exports = {
  readStatements,
  readStatement,
  readStatementJustifications,
  createUser,
  login,
  logout,
  createVote,
  deleteVote,
  createStatement,
  updateStatement,
  deleteStatement,
  createJustification,
  deleteJustification,
  readCitationReference,
  updateCitationReference,
}
