const argon2 = require('argon2')
const cryptohat = require('cryptohat')
const uuid = require('uuid')
const moment = require('moment')
const Promise = require('bluebird')
const URLSafeBase64 = require('urlsafe-base64');

const assign = require('lodash/assign')
const cloneDeep = require('lodash/cloneDeep')
const concat = require('lodash/concat')
const differenceBy = require('lodash/differenceBy')
const every = require('lodash/every')
const filter = require('lodash/filter')
const find = require('lodash/find')
const findIndex = require('lodash/findIndex')
const forEach = require('lodash/forEach')
const get = require('lodash/get')
const groupBy = require('lodash/groupBy')
const isString = require('lodash/isString')
const join = require('lodash/join')
const keys = require('lodash/keys')
const last = require('lodash/last')
const map = require('lodash/map')
const merge = require('lodash/merge')
const partition = require('lodash/partition')
const pickBy = require('lodash/pickBy')
const set = require('lodash/set')
const sortBy = require('lodash/sortBy')
const toNumber = require('lodash/toNumber')
const values = require('lodash/values')
const zip = require('lodash/zip')

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
const statementCompoundsDao = require('./dao/statementCompoundsDao')
const perspectivesDao = require('./dao/perspectivesDao')
const {
  statementValidator,
  justificationValidator,
  credentialValidator,
  userValidator,
  voteValidator,
  citationReferenceValidator,
  statementCompoundValidator,
} = require('./validators')
const {
  OTHER_STATEMENTS_HAVE_EQUIVALENT_TEXT_CONFLICT,
  OTHER_CITATION_REFERENCES_HAVE_SAME_CITATION_QUOTE_CONFLICT,
  OTHER_CITATIONS_HAVE_EQUIVALENT_TEXT_CONFLICT,
} = require("./codes/entityConflictCodes")
const {
  OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_ROOTED_IN_THIS_STATEMENT,
  OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_ROOTED_IN_THIS_STATEMENT,
  OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_STATEMENT,
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
  EntityNotFoundError,
  EntityConflictError,
  EntityValidationError,
  RequestValidationError,
  UserActionsConflictError,
  ImpossibleError,
  EntityTooOldToModifyError,
  InvalidLoginError,
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
  SortDirection,
  ContinuationSortDirection,
} = require('./models')
const {
  rethrowTranslatedErrors,
  isTruthy,
  assert,
} = require('./util')
const {
  decircularizePerspective
} = require('./serialization')


const withPermission = (authToken, permission) => permissionsDao.getUserIdWithPermission(authToken, permission)
    .then( ({userId, hasPermission}) => {
      if (!userId) {
        throw new AuthenticationError()
      }
      if (!hasPermission) {
        throw new AuthorizationError(permission)
      }
      return userId
    })

const withAuth = (authToken) => authDao.getUserId(authToken).then(userId => {
  if (!userId) {
    throw new AuthenticationError()
  }
  return userId
})

const parseContinuationToken = continuationToken => {
  const decoded = URLSafeBase64.decode(new Buffer(continuationToken))
  const parsed = JSON.parse(decoded)
  return parsed
}

const encodeContinuationToken = continuationInfo => URLSafeBase64.encode(new Buffer(JSON.stringify(continuationInfo)))

const readStatements = ({continuationToken, sortProperty = 'created', sortDirection = SortDirection.ASCENDING, count = 25 }) => {
  const countNumber = toNumber(count)
  if (!isFinite(countNumber)) {
    throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
  }

  if (!continuationToken) {
    const sorts = createSorts(sortProperty, sortDirection)
    return readInitialStatements(sorts, countNumber)
  }
  return readMoreStatements(continuationToken, countNumber)
}

const readCitations = ({continuationToken, sortProperty = 'created', sortDirection = SortDirection.ASCENDING, count = 25 }) => {
  const countNumber = toNumber(count)
  if (!isFinite(countNumber)) {
    throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
  }

  if (!continuationToken) {
    const sorts = createSorts(sortProperty, sortDirection)
    return readInitialCitations(sorts, countNumber)
  }
  return readMoreCitations(continuationToken, countNumber)
}

const readCitationReferences = ({continuationToken, sortProperty = 'created', sortDirection = SortDirection.ASCENDING, count = 25 }) => {
  const countNumber = toNumber(count)
  if (!isFinite(countNumber)) {
    throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
  }

  if (!continuationToken) {
    const sorts = createSorts(sortProperty, sortDirection)
    return readInitialCitationReferences(sorts, countNumber)
  }
  return readMoreCitationReferences(continuationToken, countNumber)
}

const readJustifications = ({
                              continuationToken,
                              sortProperty = 'created',
                              sortDirection = SortDirection.ASCENDING,
                              count = 25,
                              filters,
}) => {
  const countNumber = toNumber(count)
  if (!isFinite(countNumber)) {
    throw new RequestValidationError(`count must be a number. ${count} is not a number.`)
  }
  if (filters && filter(filters).length > 1) {
    throw new RequestValidationError("Only one filter is supported because justifications have one basis.")
  }

  if (!continuationToken) {
    const sorts = createSorts(sortProperty, sortDirection)
    return readInitialJustifications(sorts, countNumber, filters)
  }
  return readMoreJustifications(continuationToken, countNumber, filters)
}

const createSorts = (sortProperty, sortDirection) => {
  const sortProperties = isString(sortProperty) ? [sortProperty] : sortProperty
  const sortDirections = isString(sortDirection) ? [sortDirection] : sortDirection
  const sorts = []
  forEach(sortProperties, (sortProperty, index) => {
    sorts.push({
      property: sortProperty,
      direction: sortDirections[index] || SortDirection.ASCENDING
    })
  })
  return sorts
}

const createContinuationToken = (sorts, entities) => {
  const lastEntity = last(entities)
  let continuationToken = null

  if (lastEntity) {
    const continuationInfos = createContinuationInfo(sorts, lastEntity)
    continuationToken = encodeContinuationToken(continuationInfos)
  }
  return continuationToken
}

const readInitialStatements = (requestedSorts, count) => {
  const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
  const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
  return statementsDao.readStatements(unambiguousSorts, count)
      .then(statements => {
        const continuationToken = createContinuationToken(unambiguousSorts, statements)
        return {
          statements,
          continuationToken,
        }
      })
}

const readInitialCitations = (requestedSorts, count) => {
  const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
  const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
  return citationsDao.readCitations(unambiguousSorts, count)
      .then(citations => {
        const continuationToken = createContinuationToken(unambiguousSorts, citations)
        return {
          citations,
          continuationToken,
        }
      })
}

const readInitialCitationReferences = (requestedSorts, count) => {
  const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
  const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
  return citationReferencesDao.readCitationReferences(unambiguousSorts, count)
      .then(citationReferences => {
        const continuationToken = createContinuationToken(unambiguousSorts, citationReferences)
        return {
          citationReferences,
          continuationToken,
        }
      })
}

const readInitialJustifications = (requestedSorts, count, filters) => {
  const disambiguationSorts = [{property: 'id', direction: SortDirection.ASCENDING}]
  const unambiguousSorts = concat(requestedSorts, disambiguationSorts)
  return justificationsDao.readJustifications(unambiguousSorts, count, filters)
      .then(justifications => {
        const continuationToken = createContinuationToken(unambiguousSorts, justifications)
        return {
          justifications,
          continuationToken,
        }
      })
}

const createContinuationInfo = (sorts, lastEntity, filters) => {
  const sortContinuations = map(sorts, ({property, direction}) => {
    const continuationInfo = {
      p: property,
      v: get(lastEntity, property)
    }
    // Only set the direction if necessary to overcome the default
    if (direction === SortDirection.DESCENDING) {
      continuationInfo.d = ContinuationSortDirection.DESCENDING
    }
    return continuationInfo
  })
  return {
    s: sortContinuations,
    f: filters,
  }
}

const createNextContinuationToken = (sortContinuations, entities) => {
  const lastEntity = last(entities)
  let nextContinuationToken
  if (lastEntity) {
    // Everything from the previous token should be fine except we need to update the values
    const nextContinuationInfo = updateContinuationInfo(sortContinuations, lastEntity)
    nextContinuationToken = encodeContinuationToken(nextContinuationInfo)
  }
  return nextContinuationToken
}

const readMoreStatements = (continuationToken, count) => {
  const {s: sortContinuations} = parseContinuationToken(continuationToken)
  return statementsDao.readMoreStatements(sortContinuations, count)
      .then(statements => {
        const nextContinuationToken = createNextContinuationToken(sortContinuations, statements) || continuationToken
        return {
          statements,
          continuationToken: nextContinuationToken
        }
      })
}

const readMoreCitations = (continuationToken, count) => {
  const {s: sortContinuations} = parseContinuationToken(continuationToken)
  return citationsDao.readMoreCitations(sortContinuations, count)
      .then(citations => {
        const nextContinuationToken = createNextContinuationToken(sortContinuations, citations) || continuationToken
        return {
          citations,
          continuationToken: nextContinuationToken
        }
      })
}

const readMoreCitationReferences = (continuationToken, count) => {
  const {s: sortContinuations} = parseContinuationToken(continuationToken)
  return citationReferencesDao.readMoreCitationReferences(sortContinuations, count)
      .then(citationReferences => {
        const nextContinuationToken = createNextContinuationToken(sortContinuations, citationReferences) || continuationToken
        return {
          citationReferences,
          continuationToken: nextContinuationToken
        }
      })
}

const readMoreJustifications = (continuationToken, count) => {
  const {
    s: sortContinuations,
    f: filters,
  } = parseContinuationToken(continuationToken)
  return justificationsDao.readJustifications(sortContinuations, count, filters, true)
      .then(justifications => {
        const [goodJustifications, badJustifications] = partition(justifications, j =>
            j.basis.type !== JustificationBasisType.STATEMENT_COMPOUND ||
            j.basis.entity.atoms &&
            j.basis.entity.atoms.length > 0 &&
            every(j.basis.entity.atoms, a => isTruthy(a.statement.id))
        )
        if (badJustifications.length > 0) {
          logger.error(`these justifications have invalid statement compounds: ${join(map(badJustifications, j => j.id), ', ')}`)
          logger.error(badJustifications)
        }
        return goodJustifications
      })
      .then(justifications => {
        const nextContinuationToken = createNextContinuationToken(sortContinuations, justifications) || continuationToken
        return {
          justifications,
          continuationToken: nextContinuationToken
        }
      })
}

const updateContinuationInfo = (sortContinuations, lastEntity, filters) => {
  const newSortContinuations = map(sortContinuations, sortContinuation => {
    const nextSortContinuation = cloneDeep(sortContinuation)
    nextSortContinuation.v = get(lastEntity, sortContinuation.p)
    return nextSortContinuation
  })

  return {
    s: newSortContinuations,
    f: filters,
  }
}

const readStatement = ({statementId, authToken}) => statementsDao.readStatementById(statementId)
    .then(statement => {
      if (!statement) {
        throw new EntityNotFoundError(EntityTypes.STATEMENT, statementId)
      }
      return statement
    })

const readStatementJustifications = ({statementId, authToken}) => Promise.resolve([
    statementId,
    authToken,
])
    .then( ([statementId, authToken]) => Promise.all([
        statementsDao.readStatementById(statementId),
        justificationsDao.readJustificationsWithBasesAndVotesByRootStatementId(authToken, statementId),
    ]))
        .then( ([statement, justifications]) => {
          if (!statement) {
            throw new EntityNotFoundError(EntityTypes.STATEMENT, statementId)
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
        throw new EntityValidationError(({user: validationErrors}))
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
        throw new EntityValidationError({credentials: validationErrors})
      }
      return credentials
    })
    .then(credentials => Promise.all([
        credentials,
        usersDao.readAuthUserByEmail(credentials.email),
    ]))
    .then( ([credentials, user]) => {
      if (!user) {
        throw new EntityNotFoundError(EntityTypes.USER, credentials.email)
      }
      return Promise.all([
          user,
          argon2.verify(user.hash, credentials.password),
      ])
    })
    .then( ([user, isMatch]) => {
      if (!isMatch) {
        throw new InvalidLoginError()
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
        throw new EntityValidationError({vote: validationErrors})
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

const deleteVote = ({authToken, vote}) => withAuth(authToken)
    .then(userId => {
      const validationErrors = voteValidator.validate(vote)
      if (validationErrors.hasErrors) {
        throw new EntityValidationError({vote: validationErrors})
      }
      return userId
    })
    .then(userId => votesDao.deleteEquivalentVotes(userId, vote))
    .then(deletedVoteIds => {
      if (deletedVoteIds.length === 0) {
        logger.debug('No votes to unvote')
        throw new EntityNotFoundError(EntityTypes.VOTE, vote.id)
      } else if (deletedVoteIds.length > 1) {
        logger.warn(`Deleted ${deletedVoteIds.length} votes at once!`)
      }
      return deletedVoteIds
    })

const updateStatement = ({authToken, statement}) => withAuth(authToken)
    .then(userId => {
      const validationErrors = statementValidator.validate(statement)
      if (validationErrors.hasErrors) {
        throw new EntityValidationError({statement: validationErrors})
      }
      return userId
    })
    .then(userId => Promise.all([
      userId,
      statementsDao.countEquivalentStatements(statement),
      Promise.props({
        [OTHER_USERS_HAVE_CREATED_JUSTIFICATIONS_ROOTED_IN_THIS_STATEMENT]: statementsDao.hasOtherUsersRootedJustifications(statement, userId),
        [OTHER_USERS_HAVE_VOTED_ON_JUSTIFICATIONS_ROOTED_IN_THIS_STATEMENT]: statementsDao.hasOtherUsersRootedJustificationsVotes(statement, userId),
        [OTHER_USERS_HAVE_BASED_JUSTIFICATIONS_ON_THIS_STATEMENT]: statementsDao.isBasisToOtherUsersJustifications(statement, userId),
      }),
      permissionsDao.userHasPermission(userId, EDIT_ANY_ENTITY),
    ]))
    .then( ([
        userId,
        equivalentStatementsCount,
        userActionConflicts,
        hasPermission,
      ]) => {
      if (equivalentStatementsCount > 0) {
        throw new EntityConflictError({
          hasErrors: true,
          fieldErrors: {
            text: [OTHER_STATEMENTS_HAVE_EQUIVALENT_TEXT_CONFLICT]
          }
        })
      } else if (!hasPermission) {
        const userActionConflictCodes = keys(pickBy(userActionConflicts))
        if (userActionConflictCodes.length > 0) {
          throw new UserActionsConflictError({
            hasErrors: true,
            modelErrors: userActionConflictCodes,
          })
        }
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
        throw new EntityNotFoundError(EntityTypes.STATEMENT, statement.id)
      }

      asyncRecordAction(userId, ActionType.UPDATE, ActionTargetType.STATEMENT, now, updatedStatement.id)
      return updatedStatement
    })

const readCitationReference = ({authToken, citationReferenceId}) => citationReferencesDao.read(citationReferenceId)

const readStatementCompound = (authToken, statementCompoundId) => statementCompoundsDao.read(statementCompoundId)

const updateCitationReference = ({authToken, citationReference}) => withAuth(authToken)
    .then(userId => {
      const validationErrors = citationReferenceValidator.validate(citationReference)
      if (validationErrors.hasErrors) {
        throw new EntityValidationError({citationReference: validationErrors})
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
        entityConflicts[OTHER_CITATION_REFERENCES_HAVE_SAME_CITATION_QUOTE_CONFLICT] =
            citationReferencesDao.hasEquivalentCitationReferences(citationReference)
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

        entityConflicts[OTHER_CITATIONS_HAVE_EQUIVALENT_TEXT_CONFLICT] = citationsDao.hasEquivalentCitations(citation)

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
      if (entityConflictCodes.length > 0) {
        throw new EntityConflictError({
          hasErrors: true,
          modelErrors: entityConflictCodes,
        })
      }

      const userActionsConflictCodes = keys(pickBy(userActionConflicts))
      if (userActionsConflictCodes.length > 0) {
        if (!hasPermission) {
          throw new UserActionsConflictError({
            hasErrors: true,
            modelErrors: userActionsConflictCodes,
          })
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
            updateCitationReferenceUrlsAsUser(citationReference, urlDiffs, userId, now) :
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

const updateCitationReferenceUrlsAsUser = (citationReference, urlDiffs, userId, now) => Promise.resolve()
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
    .then( ({hasId: extantUrls, noId: newUrls}) => Promise.all([
      extantUrls || [],
      newUrls ? createUrlsAsUser(newUrls, userId, now) : [],
    ]))
    .then( ([extantUrls, createdUrls]) => extantUrls.concat(createdUrls) )
    .then( updatedUrls => Promise.all([
      citationReferencesDao.readUrlsByCitationReferenceId(citationReference.id),
      updatedUrls,
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
      const now = new Date()
      const result = [userId, now, statement, dependentJustifications]

      if (!statement) {
        throw new EntityNotFoundError(EntityTypes.STATEMENT, statementId)
      }
      if (hasPermission) {
        return result
      }
      if (userId !== statement.creatorUserId) {
        throw new AuthorizationError({modelErrors: [CANNOT_MODIFY_OTHER_USERS_ENTITIES]})
      }

      const created = moment(statement.created)
      const graceCutoff = created.add.apply(created, config.modifyEntityGracePeriod)

      const nowMoment = moment(now)
      if (nowMoment.isAfter(graceCutoff)) {
        throw new EntityTooOldToModifyError(config.modifyEntityGracePeriod)
      }

      const otherUsersJustificationsDependentUponStatement = filter(dependentJustifications, j => j.creatorUserId !== userId)
      if (otherUsersJustificationsDependentUponStatement.length > 0) {
        throw new UserActionsConflictError()
      }

      return result
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
      asyncRecordAction(userId, ActionType.DELETE, ActionTargetType.STATEMENT, now, deletedStatementId),
      Promise.all(map(deletedJustificationIds, id => asyncRecordAction(userId, ActionType.DELETE, ActionTargetType.JUSTIFICATION, now, id)))
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
        return {justification, isExtant: true}
      }
      return Promise.resolve()
          .then(() => {
            const validationErrors = justificationValidator.validate(justification)
            if (validationErrors.hasErrors) {
              throw new EntityValidationError(validationErrors)
            }
            return [userId, now]
          })
          .then( ([userId, now]) => createValidJustificationAsUser(justification, userId, now))
    })

const createValidJustificationAsUser = (justification, userId, now) => Promise.all([
      now,
      createJustificationTarget(justification.target, userId, now)
          .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.target')),
      createJustificationBasis(justification.basis, userId, now)
          .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.basis')),
    ])
    .then( ([
        now,
        {isExtant: isTargetExtant, targetType, targetEntity},
        {isExtant: isBasisExtant, basisType, basisEntity}
      ]) => {
      justification = cloneDeep(justification)

      justification.target = {
        type: targetType,
        entity: targetEntity,
      }
      if (targetType === JustificationTargetType.STATEMENT) {
        const rootStatementId = get(justification, 'rootStatement.id')
        if (rootStatementId && rootStatementId !== targetEntity.id) {
          logger.warning(`Statement-targeting justification's rootStatementId (${rootStatementId} is not equal to targetEntity.id (${targetEntity.id})`)
        }
        set(justification, 'rootStatement.id', targetEntity.id)
      }

      justification.basis = {
        type: basisType,
        entity: basisEntity
      }
      return [now, justification]
    })
    .then( ([now, justification]) => Promise.all([
        now,
        justification,
        justificationsDao.readJustificationEquivalentTo(justification)
    ]))
    .then( ([now, justification, equivalentJustification]) => Promise.all([
        justification,
        !!equivalentJustification,
        equivalentJustification || justificationsDao.createJustification(justification, userId, now)
            .then(asyncRecordEntityAction(userId, ActionType.CREATE, ActionTargetType.JUSTIFICATION, now))
    ]))
    .then( ([justification, isExtant, dbJustification]) => {
      const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
      asyncRecordAction(userId, actionType, ActionTargetType.JUSTIFICATION, now, dbJustification.id)
      return [justification, isExtant, dbJustification]
    })
    .then( ([inJustification, isExtant, dbJustification]) => {
      const justification = cloneDeep(dbJustification)
      justification.target.entity = inJustification.target.entity
      justification.basis.entity = inJustification.basis.entity
      return {
        isExtant,
        justification,
      }
    })

const createJustificationTarget = (justificationTarget, userId, now) => {
  switch (justificationTarget.type) {

    case JustificationTargetType.JUSTIFICATION:
      return createJustificationAsUser(justificationTarget.entity, userId, now)
          .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
          .then( ({isExtant, justification}) => ({
            isExtant,
            targetType: justificationTarget.type,
            targetEntity: justification,
          }))

    case JustificationTargetType.STATEMENT:
      return createStatementAsUser(justificationTarget.entity, userId, now)
          .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
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
      return createCitationReferenceAsUser(justificationBasis.entity, userId, now)
          .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
          .then( ({isExtant, citationReference}) => ({
            isExtant,
            basisType: JustificationBasisType.CITATION_REFERENCE,
            basisEntity: citationReference,
          }))

    case JustificationBasisType.STATEMENT_COMPOUND:
      return createStatementCompoundAsUser(justificationBasis.entity, userId, now)
          .catch(EntityValidationError, EntityConflictError, UserActionsConflictError, rethrowTranslatedErrors('fieldErrors.entity'))
          .then( ({isExtant, statementCompound}) => ({
            isExtant,
            basisType: JustificationBasisType.STATEMENT_COMPOUND,
            basisEntity: statementCompound,
          }))

    default:
      throw new ImpossibleError(`Unsupported JustificationBasisType: ${justificationBasis.type}`)
  }
}

const createCitationReferenceAsUser = (citationReference, userId, now) =>
    Promise.all([
      createCitationAsUser(citationReference.citation, userId, now),
      createUrlsAsUser(citationReference.urls, userId, now),
    ])
    .then( ([{citation, isExtant: isCitationExtant}, urls]) => {
      citationReference.citation.id = citation.id
      return Promise.all([
        citation,
        urls,
        createJustCitationReferenceAsUser(citationReference, userId, now)
      ])
    })
    .then( ([citation, urls, {isExtant, citationReference}]) => {
      citationReference.citation = citation
      citationReference.urls = urls
      return Promise.all([
        isExtant,
        citationReference,
        createCitationReferenceUrlsAsUser(citationReference, userId, now)
      ])
    })
    .then( ([isExtant, citationReference, citationReferenceUrls]) => ({isExtant, citationReference}))

const createUrlsAsUser = (urls, userId, now) => Promise.resolve()
    .then(() => filter(urls, url => url.url))
    .then(nonEmptyUrls => Promise.all(map(nonEmptyUrls, url => createUrlAsUser(url, userId, now))))

const createUrlAsUser = (url, userId, now) => {
  return urlsDao.readUrlEquivalentTo(url)
      .then( equivalentUrl => {
        if (equivalentUrl) {
          return equivalentUrl
        }
        return urlsDao.createUrl(url, userId, now)
            .then(asyncRecordEntityAction(userId, ActionType.CREATE, ActionTargetType.URL, now))
      })
}

const createJustCitationReferenceAsUser = (citationReference, userId, now) => Promise.resolve()
    .then(() => citationReference.id ?
        citationReference :
        citationReferencesDao.readCitationReferencesEquivalentTo(citationReference)
    )
    .then(equivalentCitationReference => Promise.all([
        !!equivalentCitationReference,
        equivalentCitationReference || citationReferencesDao.createCitationReference(citationReference, userId, now)
          .then(asyncRecordEntityAction(userId, ActionType.CREATE, ActionTargetType.CITATION_REFERENCE, now))
    ]))
    .then( ([isExtant, citationReference]) => ({
      isExtant,
      citationReference,
    }))

const createCitationReferenceUrlsAsUser = (citationReference, userId, now) =>
    citationReferencesDao.readCitationReferenceUrlsForCitationReference(citationReference)
        .then( extantCitationReferenceUrls => {
          const extantCitationReferenceUrlsByUrlId = {}
          forEach(extantCitationReferenceUrls, extantCitationReferenceUrl => {
            extantCitationReferenceUrlsByUrlId[extantCitationReferenceUrl.urlId] = extantCitationReferenceUrl
          })

          return map(citationReference.urls, url => extantCitationReferenceUrlsByUrlId[url.id] ?
              extantCitationReferenceUrlsByUrlId[url.id] :
              citationReferencesDao.createCitationReferenceUrl(citationReference, url, userId, now)
          )
        })

const createCitationAsUser = (citation, userId, now) => Promise.resolve()
    .then(() => {
      if (citation.id) return {
        isExtant: true,
        citation,
      }
      return citationsDao.readCitationEquivalentTo(citation)
          .then( equivalentCitation => {
            if (equivalentCitation) {
              return {
                isExtant: true,
                citation: equivalentCitation,
              }
            }
            return citationsDao.createCitation(citation, userId, now)
                .then(asyncRecordEntityAction(userId, ActionType.CREATE, ActionTargetType.CITATION, now))
                .then(citation => ({
                  isExtant: false,
                  citation
                }))
          })
    })

const createStatementCompoundAsUser = (statementCompound, userId, now) => Promise.resolve()
    .then(() => {
      const validationErrors = statementCompoundValidator.validate(statementCompound)
      if (validationErrors.hasErrors) {
        throw new EntityValidationError(validationErrors)
      }
      return userId
    })
    .then(userId => createValidStatementCompoundAsUser(statementCompound, userId, now))

const createValidStatementCompoundAsUser = (statementCompound, userId, now) => Promise.resolve()
    .then(() => statementCompound.id ?
        statementCompound :
        statementCompoundsDao.readStatementCompoundEquivalentTo(statementCompound)
    )
    .then(equivalentStatementCompound => {
      const isExtant = !!equivalentStatementCompound
      return Promise.all([
        isExtant,
        isExtant ? equivalentStatementCompound : statementCompoundsDao.createStatementCompound(userId, statementCompound, now),
        statementCompound.atoms,
      ])
    })
    .then( ([isExtant, statementCompound, statementCompoundAtoms]) => Promise.all([
      isExtant,
      statementCompound,
      isExtant ? statementCompound.atoms : createStatementCompoundAtoms(statementCompound, statementCompoundAtoms, userId, now)
    ]))
    .then( ([isExtant, statementCompound, statementCompoundAtoms]) => {
      const actionType = isExtant ? ActionType.TRY_CREATE_DUPLICATE : ActionType.CREATE
      asyncRecordAction(userId, actionType, ActionTargetType.STATEMENT_COMPOUND, now, statementCompound.id)

      statementCompound.atoms = statementCompoundAtoms
      return {
        isExtant,
        statementCompound,
      }
    })

const createStatementCompoundAtoms = (statementCompound, statementCompoundAtoms, userId, now) => Promise.resolve()
    .then(() => Promise.all(map(statementCompoundAtoms, atom =>
        atom.statement.id ?
            [atom, {isExtant: true, statement: atom.statement}] :
            Promise.all([atom, createStatementAsUser(atom.statement, userId, now)])
    )))
    .then(atomsWithStatements => map(atomsWithStatements, ([atom, {statement}]) => {
      atom.statement = statement
      return atom
    }))
    .then(atoms => Promise.all([
        atoms,
        Promise.all(map(atoms, (atom, index) => statementCompoundsDao.createStatementCompoundAtom(statementCompound, atom, index)))
    ]))
    .then( ([atoms, dbAtoms]) => {
      // Merging ensures that both the statement text and atom IDs will be present
      const merged = map(zip(atoms, dbAtoms), ([atom, dbAtom]) => merge(atom, dbAtom))
      return merged
    })

const createStatement = ({authToken, statement}) => withAuth(authToken)
    .then(userId => {
      const now = new Date()
      return createStatementAsUser(statement, userId, now)
    })

const createStatementAsUser = (statement, userId, now) => Promise.resolve()
    .then(() => {
      const validationErrors = statementValidator.validate(statement)
      if (validationErrors.hasErrors) {
        throw new EntityValidationError(validationErrors)
      }
      return userId
    })
    .then(userId => createValidStatementAsUser(statement, userId, now))

const createValidStatementAsUser = (statement, userId, now) => Promise.resolve()
    .then(() => Promise.all([
      userId,
      isTruthy(statement.id) ? statement : statementsDao.readStatementByText(statement.text),
      now,
    ]))
    .then( ([userId, extantStatement, now]) => {
      const isExtant = !!extantStatement
      return Promise.all([
        userId,
        now,
        isExtant,
        isExtant ? extantStatement : statementsDao.createStatement(userId, statement, now),
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
      const now = new Date()
      const result = [userId, now, justification]

      if (hasPermission) {
        return result
      }

      if (userId !== justification.creatorUserId) {
        throw new AuthorizationError({modelErrors: [CANNOT_MODIFY_OTHER_USERS_ENTITIES]})
      }

      const created = moment(justification.created)
      const graceCutoff = created.add.apply(created, config.modifyEntityGracePeriod)
      const nowMoment = moment(now)
      if (nowMoment.isAfter(graceCutoff)) {
        throw new EntityTooOldToModifyError(config.modifyEntityGracePeriod)
      }

      return result
    })
    .then( ([userId, now, justification]) => Promise.all([
      userId,
      now,
      justification,
      deleteCounterJustificationsToJustificationIds([justification.id], userId, now),
    ]))
    .then( ([userId, now, justification, deletedCounterJustificationIds]) => Promise.all([
      userId,
      now,
      justificationsDao.deleteJustification(justification, now),
      map(deletedCounterJustificationIds, id => asyncRecordAction(userId, ActionType.DELETE, ActionTargetType.JUSTIFICATION, now, id)),
    ]))
    .then( ([userId, now, deletedJustificationId]) => Promise.all([
      deletedJustificationId,
      asyncRecordAction(userId, ActionType.DELETE, ActionTargetType.JUSTIFICATION, now, deletedJustificationId),
    ]))
    .then( ([deletedJustificationId]) => ({
      deletedJustificationId,
    }))

const deleteCounterJustificationsToJustificationIds = (justificationIds, userId, now, deletedJustificationIds = []) => Promise.resolve()
    .then(() => {
      if (justificationIds.length === 0) {
        return deletedJustificationIds
      }
      return justificationsDao.deleteCounterJustificationsToJustificationIds(justificationIds, now)
          .then(currentlyDeletedJustificationIds =>
              deleteCounterJustificationsToJustificationIds(currentlyDeletedJustificationIds, userId, now,
                  deletedJustificationIds.concat(currentlyDeletedJustificationIds))
          )
    })

const readFeaturedPerspectives = ({authToken}) => authDao.getUserId(authToken)
    .then(userId => perspectivesDao.readFeaturedPerspectivesWithVotesForOptionalUserId(userId))
    .then(perspectives => map(perspectives, decircularizePerspective))

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
  createUser,
  login,
  logout,
  readStatements,
  readStatement,
  readStatementCompound,
  readStatementJustifications,
  createVote,
  deleteVote,
  createStatement,
  updateStatement,
  deleteStatement,
  createJustification,
  deleteJustification,
  readCitationReference,
  readCitations,
  readCitationReferences,
  readJustifications,
  updateCitationReference,
  readFeaturedPerspectives,
}
