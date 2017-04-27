const {query, queries} = require('./db')
const {
  toStatement,
  toJustification,
  toCitationReference,
  toCitation,
  toUrl,
  toVote
} = require('./orm')
const argon2 = require('argon2')
const cryptohat = require('cryptohat')
const uuid = require('uuid');
const moment = require('moment')
const Promise = require('bluebird')

const config = require('./config')
const {assert} = require('./util')
const {logger} = require('./logger')
const merge = require('lodash/merge')
const assign = require('lodash/assign')
const forEach = require('lodash/forEach')
const cloneDeep = require('lodash/cloneDeep')
const filter = require('lodash/filter')

const {
  JustificationTargetType,
  JustificationBasisType,
  ActionTargetType,
  ActionType,
  VoteTargetType
} = require('./models')

const CREATE_USER = 'CREATE_USER'

const withPermission = (authToken, permission) => query(`
    select distinct auth.user_id
    from authentication_tokens auth
        join users u using (user_id)
        -- try and find the permission by user_permissions
        left join user_permissions up using (user_id)
        left join permissions user_perm on up.permission_id = user_perm.permission_id
        -- or by group_permissions
        left join user_groups ug using (user_id)
        left join group_permissions gp using (group_id)
        left join permissions group_perm on gp.permission_id = group_perm.permission_id
      where 
            auth.token = $1 
        and (user_perm.name = $2 or group_perm.name = $2)
        and auth.expires > $3 
        and auth.deleted is null
        and u.deleted is null
        and up.deleted is null
        and user_perm.deleted is null
        and ug.deleted is null
        and gp.deleted is null
        and group_perm.deleted is null
`, [authToken, permission, new Date()])
    // TODO does this work deconstructing the first row?  What happen when it is empty?
    .then(({rows: [{user_id: userId}]}) => userId ? Promise.resolve(userId) : Promise.reject())

const statements = () => query('select * from statements where deleted is null')
  .then(({rows: statements}) => statements.map(toStatement))

const collectJustifications = (statementId, justifications) => {
  const rootJustifications = [], counterJustificationsByJustificationId = {}
  for (let justification of justifications) {
    if (justification.target_type === JustificationTargetType.STATEMENT) {
      assert(() => justification.target_id === statementId)
      rootJustifications.push(justification)
    } else {
      assert(() => justification.target_type === JustificationTargetType.JUSTIFICATION)
      if (!counterJustificationsByJustificationId.hasOwnProperty(justification.target_id)) {
        counterJustificationsByJustificationId[justification.target_id] = []
      }
      counterJustificationsByJustificationId[justification.target_id].push(justification)
    }
  }
  return {
    rootJustifications,
    counterJustificationsByJustificationId,
  }
}

const collectUrls = urls => {
  const urlsByJustificationId = {}
  for (let url of urls) {
    if (!urlsByJustificationId.hasOwnProperty(url.justification_id)) {
      urlsByJustificationId[url.justification_id] = []
    }
    urlsByJustificationId[url.justification_id].push(url)
  }
  return urlsByJustificationId
}

const statementJustifications = ({statementId, authToken}) => queries([
    {
      // Statement
      query: 'select * from statements where statement_id = $1 and deleted is null',
      args: [statementId],
    },
    {
      // Justifications, justifications' bases, and justifications' votes
      query: `select 
                j.*
                , s.statement_id as basis_statement_id
                , s.text as basis_statement_text
                
                , r.citation_reference_id as basis_citation_reference_id
                , r.quote as basis_citation_reference_quote
                , c.citation_id as basis_citation_reference_citation_id
                , c.text as basis_citation_reference_citation_text
                
                , v.vote_id
                , v.polarity AS vote_polarity
                , v.target_type AS vote_target_type
                , v.target_id AS vote_target_id
              from justifications j 
                left join statements s ON j.basis_type = 'STATEMENT' AND j.basis_id = s.statement_id
                left join citation_references r ON j.basis_type = 'CITATION_REFERENCE' AND j.basis_id = r.citation_reference_id
                left join citations c USING (citation_id)
                left join authentication_tokens auth ON auth.token = $2
                left join votes v ON 
                      v.target_type = $3
                  and j.justification_id = v.target_id
                  and v.user_id = auth.user_id
                  and v.deleted IS NULL
                where 
                      j.deleted is null
                  and s.deleted is null
                  and j.root_statement_id = $1`,
      args: [statementId, authToken, VoteTargetType.JUSTIFICATION]
    },
    {
      // Urls
      query: `select 
                    j.justification_id, 
                    u.* 
                  from justifications j 
                    join citation_references r ON j.basis_type = 'CITATION_REFERENCE' AND j.basis_id = r.citation_reference_id
                    join citation_reference_urls USING (citation_reference_id)
                    join urls u USING (url_id)
                    where
                          j.deleted is null
                      and j.root_statement_id = $1
                    order by j.justification_id`,
      args: [statementId]
    }
  ])
  .then(([{rows: [statement]}, {rows: justifications}, {rows: urls}]) => {
    if (!statement) {
      return {statement}
    }
    const urlsByJustificationId = collectUrls(urls)
    const {rootJustifications, counterJustificationsByJustificationId} =
        collectJustifications(statement.statement_id, justifications)
    return {
      statement: toStatement(statement),
      justifications: rootJustifications.map(j =>
          toJustification(j, urlsByJustificationId, counterJustificationsByJustificationId)
      )
    }
  })

const createUser = ({user: {email, password}, authToken}) => {
  withPermission(authToken, CREATE_USER).then(
      userId => {
        argon2.generateSalt().then(salt => {
          argon2.hash(password, salt)
              .then( hash => query('insert into users (email, hash) values ($1, $2) returning user_id', [email, hash]) )
              .then( ({rows: [{user_id: id}]}) => ({user: {email, id}}) )
              .then( user => query(
                  'insert into actions (user_id, action_type, target_id, target_type, tstamp) values ()',
                  [userId, 'CREATE', user.id, 'USER', new Date()]
              )
                  .then(() => user))
        })
      },
      () => ({notAuthorized: true, message: 'insufficient permissions'})
  )
}

const login = ({credentials}) => {
  if (!credentials) {
    return Promise.resolve({isInvalid: true, message: 'missing credentials'})
  }
  if (!credentials.email || !credentials.password) {
    const missing = []
    if (!credentials.email) {
      missing.push('email')
    }
    if (!credentials.password) {
      missing.push('password')
    }
    return Promise.resolve({isInvalid: true, message: `missing ${missing.join(', ')}`})
  }
  return query('select user_id, hash from users where email = $1', [credentials.email])
    .then( ({rows: [user]}) => {
      if (!user) {
        return {isNotFound: true, message: 'the email does not exist'}
      }
      const {user_id: userId, hash} = user
      return argon2.verify(hash, credentials.password).then(match => {
        if (!match) return {isNotAuthorized: true, message: 'invalid credentials'}

        const authToken = cryptohat(256, 36)
        const created = new Date()
        const expires = moment().add(moment.duration.apply(moment.duration, config.authTokenDuration)).toDate()
        return query('insert into authentication_tokens (user_id, token, created, expires) values ($1, $2, $3, $4)',
            [userId, authToken, created, expires])
            .then( () => ({
              auth: {
                authToken,
                email: credentials.email
                // tokenType, expiresIn, refreshToken (another token)
              }
            }) )
      });
    })
}

const logout = ({authToken}) => query('delete from authentication_tokens where token = $1', [authToken])

const vote = ({authToken, targetType, targetId, polarity}) => {
  if (!authToken) {
    logger.debug('Missing authentication token')
    return Promise.resolve({isUnauthenticated: true})
  }
  // TODO factor out common technique
  const authQuery = 'select user_id from authentication_tokens where token = $1 and expires > $2 and deleted is null'
  const authQueryArgs = [authToken, new Date()]
  return query(authQuery, authQueryArgs).then( ({rows}) => {
    if (rows.length < 1) {
      logger.debug(`Authentication token is not valid: ${authToken}`)
      return {isUnauthenticated: true}
    }

    const {user_id: userId} = rows[0]
    const updateOppositeQuery = `update votes 
                                 set deleted = $1 
                                 where 
                                       user_id = $2 
                                   and target_type = $3 
                                   and target_id = $4 
                                   and polarity = $5 
                                   and deleted is null
                                 returning vote_id`
    const updateOppositeQueryArgs = [new Date(), userId, targetType, targetId, !polarity]

    const alreadyQuery = `select * 
                          from votes 
                            where 
                                  user_id = $1
                              and target_type = $2 
                              and target_id = $3 
                              and polarity = $4
                              and deleted is null`
    const alreadyDoneQueryArgs = [userId, targetType, targetId, polarity]
    return queries([
        {query: updateOppositeQuery, args: updateOppositeQueryArgs},
        {query: alreadyQuery, args: alreadyDoneQueryArgs},
    ]).then( ([{rows: updatedOppositeRows}, {rows: [existingVote]}]) => {
      if (updatedOppositeRows.length > 0) {
        logger.debug(`Updated ${updatedOppositeRows.length} opposite votes for args: `, updateOppositeQueryArgs)
      }
      if (existingVote) {
        logger.debug('Vote already exists', existingVote)
        return {isAlreadyDone: true, vote: toVote(existingVote)}
      }

      const createQuery = `insert into votes (user_id, target_type, target_id, polarity, created) 
                           values ($1, $2, $3, $4, $5) 
                           returning *`
      const createQueryArgs = [userId, targetType, targetId, polarity, new Date()]
      return query(createQuery, createQueryArgs).then( ({rows: [vote]}) => ({vote: toVote(vote)}) )
    })
  })
}

const unvote = ({authToken, targetType, targetId, polarity}) => {
  if (!authToken) {
    logger.debug('Missing authentication token')
    return Promise.resolve({isUnauthenticated: true})
  }
  // TODO factor out common technique
  const authQuery = 'select user_id from authentication_tokens where token = $1 and expires > $2 and deleted is null'
  return query(authQuery, [authToken, new Date()]).then( ({rows}) => {
    if (rows.length < 1) {
      logger.debug(`Authentication token is not valid: ${authToken}`)
      return {isUnauthenticated: true}
    }

    const {user_id: userId} = rows[0]


    const updateQuery = `update votes 
                         set deleted = $1 
                         where 
                               user_id = $2 
                           and target_type = $3 
                           and target_id = $4 
                           and polarity = $5 
                           and deleted is null
                         returning vote_id`
    const updateQueryArgs = [new Date(), userId, targetType, targetId, polarity]

    return query(updateQuery, updateQueryArgs).then( ({rows}) => {
      if (rows.length === 0) {
        logger.debug('No votes to unvote')
        return {isAlreadyDone: true}
      } else if (rows.length > 1) {
        logger.warn(`Deleted ${rows.length} votes at once!`, updateQueryArgs)
      }
      return {isSuccess: true}
    })
  })
}

const withAuth = (authToken) => query(`
    select user_id
    from authentication_tokens
      where 
            token = $1 
        and expires > $2
        and deleted is null 
`, [authToken, new Date()])
    // TODO does this work deconstructing the first row?  What happen when it is empty?
    .then(({rows: [{user_id: userId}]}) => userId ? Promise.resolve(userId) : Promise.reject())

const createStatement = ({authToken, statement}) => withAuth(authToken)
    .then(userId => {
      const now = new Date()
      if (!statement.text) {
        return {isInvalid: true}
      }
      return query('select * from statements where text = $1 and deleted is null', [statement.text]).then( ({rows: [row]}) => {
        if (row) {
          query(
              'insert into actions (user_id, action_type, target_id, target_type, tstamp) values ($1, $2, $3, $4, $5)',
              [userId, ActionType.TRY_CREATE_DUPLICATE, statement.id, ActionTargetType.STATEMENT, now]
          )
          // return statement while asynchronously inserting action
          return {statement: toStatement(row), isExtant: true}
        }

        return query(
            'insert into statements (text, creator_user_id, created) values ($1, $2, $3) returning *',
            [statement.text, userId, now]
        )
            .then( ({rows: [row]}) => {
              return toStatement(row)
            })
            .then(statement => {
              query(
                  'insert into actions (user_id, action_type, target_id, target_type, tstamp) values ($1, $2, $3, $4, $5)',
                  [userId, ActionType.CREATE, statement.id, ActionTargetType.STATEMENT, now]
              )
              // return statement while asynchronously inserting action
              return {statement}
            })
      })

    }, () => ({isUnauthenticated: true}))

const deleteStatement = ({authToken, statementId}) => {
  if (!authToken) {
    return Promise.resolve({isUnauthenticated: true})
  }
  return withPermission(authToken, 'DELETE_STATEMENTS').then(userId => {
    const now = new Date()
    return query('update statements set deleted = $2 where statement_id = $1 returning statement_id', [statementId, now])
        .then(({rows}) => {
          if (rows.length > 1) {
            logger.error('Delete statement deleted more than 1: ', rows)
          }
          const [{statement_id: statementId}] = rows
          query(
              'insert into actions (user_id, action_type, target_id, target_type, tstamp) values ($1, $2, $3, $4, $5)',
              [userId, ActionType.DELETE, statementId, ActionTargetType.STATEMENT, now]
          )
          // Insert action asynchronously
          return {isSuccess: true}
        })
  }, () => ({isUnauthorized: true}))
}

const createJustification = ({authToken, justification}) => withAuth(authToken)
    .then(userId => {
      if (
          !justification.rootStatementId ||
          !justification.polarity ||
          !justification.target ||
          !justification.target.type ||
          // TODO allow a new target statement (having no id)
          !justification.target.entity.id ||
          !justification.basis ||
          !justification.basis.type ||
          !justification.basis.entity
      ) {
        return {isInvalid: true}
      }

      const now = new Date()
      return selectOrInsertJustificationBasis(justification.basis, userId, now)
          .then( ({basisType, basisEntity}) => {
            justification = cloneDeep(justification)
            justification.basis = {
              type: basisType,
              entity: basisEntity
            }
            return justification
          })
          .then(justification => insertJustification(justification, userId, now))
          .then(justification => ({justification}))

    }, () => ({isUnauthenticated: true}))

const selectOrInsertJustificationBasis = (justificationBasis, userId, now) => {
  const justificationBasisType = justificationBasis.type
  switch (justificationBasisType) {
    case JustificationBasisType.CITATION_REFERENCE:
      return selectOrInsertCitationReference(justificationBasis.entity, userId, now).then(citationReference => ({
        basisType: JustificationBasisType.CITATION_REFERENCE,
        basisEntity: citationReference,
      }))

    case JustificationBasisType.STATEMENT:
      return selectOrInsertStatement(justificationBasis.entity, userId, now).then(statement => ({
        basisType: JustificationBasisType.STATEMENT,
        basisEntity: statement,
      }))

    default:
      logger.error(`Unsupported JustificationBasisType: ${justificationBasisType}`)
  }

  return Promise.reject()
}

const selectOrInsertCitationReference = (citationReference, userId, now) => Promise.props({
    citation: selectOrInsertCitation(citationReference.citation, userId, now),
    urls: selectOrInsertUrls(citationReference.urls, userId, now),
  })
    .then( ({citation, urls}) => {
      citationReference.citation = citation
      citationReference.urls = urls
      return selectOrInsertJustCitationReference(citationReference, userId, now)
    })
    .then( citationReference => {
      return Promise.props({
        citationReference,
        urls: selectOrInsertCitationReferenceUrls(citationReference, userId, now)
      })
    })
    .then( ({citationReference}) => citationReference)

const selectOrInsertUrls = (urls, userId, now) => Promise.all(urls.map(url => {
  if (url.id) {
    return url
  }
  return query('select * from urls where url = $1', [url.url])
    .then(({rows: [row]}) => {
      if (row) return url
      return query(
          'insert into urls (url, creator_user_id, created) values ($1, $2, $3) returning *',
          [url.url, userId, now]
      )
          .then( ({rows: [row]}) => row)
          .then(toUrl)
    })
}))

const selectOrInsertJustCitationReference = (citationReference, userId, now) => {
  if (citationReference.id) {
    logger.silly('returning existing citation reference', citationReference)
    return citationReference
  }
  const citation = citationReference.citation
  return query(
      'select * from citation_references where citation_id = $1 and quote = $2 and deleted is null',
      [citation.id, citationReference.quote]
  )
      .then( ({rows: [row]}) => {
        if (row) {
          logger.silly('returning found citation reference', citationReference)
          return citationReference
        }

        return query(
            'insert into citation_references (quote, citation_id, creator_user_id, created) values ($1, $2, $3, $4) returning *',
            [citationReference.quote, citation.id, userId, now]
        )
            .then( ({rows: [row]}) => {
              citationReference = assign(toCitationReference(row), citationReference)
              logger.silly('returning newly created citation reference', citationReference)
              return citationReference
            })
            .then(asyncRecordEntityAction(userId, ActionType.CREATE, ActionTargetType.CITATION_REFERENCE, now))
      })
}

const asyncRecordEntityAction = (userId, actionType, actionTargetType, now) => entity => {
  query(
      'insert into actions (user_id, action_type, target_id, target_type, tstamp) values ($1, $2, $3, $4, $5)',
      [userId, actionType, entity.id, actionTargetType, now]
  )
  return entity
}

const selectOrInsertCitationReferenceUrls = (citationReference, userId, now) => {
  const urls = citationReference.urls
  return queries(urls.map( url => ({
    query: 'select * from citation_reference_urls where citation_reference_id = $1 and url_id = $2',
    args: [citationReference.id, url.id]
  })))
      .then( (results) => {
        const associatedUrlIds = {}
        forEach(results, ({rows}) => {
          if (rows.length > 0 && rows[0].url_id) {
            associatedUrlIds[row.url_id] = true
          }
        })
        const unassociatedUrls = filter(urls, url => !associatedUrlIds[url.id])
        return queries(unassociatedUrls.map( url => ({
          query: 'insert into citation_reference_urls (citation_reference_id, url_id, creator_user_id, created) values ($1, $2, $3, $4)',
          args: [citationReference.id, url.id, userId, now]
        })))
      })
}

const selectOrInsertCitation = (citation, userId, now) => {
  // if the citation has an ID, assume it is extant
  if (citation.id) {
    logger.silly('returning existing citation', citation)
    return citation
  }
  // otherwise, if there is a citation with the same info already, use it
  return query('select * from citations where text = $1 and deleted is null', [citation.text])
      .then( ({rows: [row]}) => {
        if (row) {
          logger.silly('returning found citation', row)
          return toCitation(row)
        }
        // finally, create a new citation
        const insertCitationQuery = 'insert into citations (text, creator_user_id, created) values ($1, $2, $3) returning *'
        const insertCitationQueryArgs = [citation.text, userId, now]
        return query(insertCitationQuery, insertCitationQueryArgs)
            .then( ({rows: [row]}) => {
              const citation = toCitation(row)
              logger.silly('returning newly created citation', citation)
              return citation
            })
            .then(asyncRecordEntityAction(userId, ActionType.CREATE, ActionTargetType.CITATION, now))
      })
}

const selectOrInsertStatement = (statement, userId, now) => {
  if (statement.id) {
    logger.silly('Returning existing statement')
    return statement
  }

  return query('select * from statements where text = $1 and deleted is null', [statement.text])
      .then( ({rows: [row]}) => {
        if (row) {
          logger.silly('Found existing statement', row)
          return toStatement(row)
        }

        return query(
            'insert into statements (text, creator_user_id, created) values ($1, $2, $3) returning *',
            [statement.text, userId, now]
        )
            .then( ({rows: [row]}) => {
              const statement = toStatement(row)
              logger.silly('Returning newly created statement', statement)
              return statement
            })
            .then(asyncRecordEntityAction(userId, ActionType.CREATE, ActionTargetType.STATEMENT, now))
      })
}

const insertJustification = (justification, userId, now) => {

  const justificationQuery =
      'insert into justifications (root_statement_id, target_type, target_id, basis_type, basis_id, polarity, creator_user_id, created) ' +
      'values ($1, $2, $3, $4, $5, $6, $7, $8) returning *'
  const justificationQueryArgs = [
    justification.rootStatementId,
    justification.target.type,
    justification.target.entity.id,
    justification.basis.type,
    justification.basis.entity.id,
    justification.polarity,
    userId,
    now
  ]

  return query(justificationQuery, justificationQueryArgs)
      .then( ({rows: [row]}) => {
        // merge in the previous stuff, which might have details about the basis and target
        return merge(toJustification(row), justification)
      })
      .then(asyncRecordEntityAction(userId, ActionType.CREATE, ActionTargetType.JUSTIFICATION, now))
}

const deleteJustification = ({authToken, justificationId}) => {
  if (!authToken) {
    return Promise.resolve({isUnauthenticated: true})
  }
  return withPermission(authToken, 'DELETE_JUSTIFICATIONS').then(userId => {
    const now = new Date()
    return query('update justifications set deleted = $2 where justification_id = $1 returning justification_id', [justificationId, now])
        .then(({rows}) => {
          if (rows.length > 1) {
            logger.error(`Delete justification deleted ${rows.length} rows:`, rows)
          }
          const [{justification_id: justificationId}] = rows
          query(
              'insert into actions (user_id, action_type, target_id, target_type, tstamp) values ($1, $2, $3, $4, $5)',
              [userId, ActionType.DELETE, justificationId, ActionTargetType.JUSTIFICATION, now]
          )
          // Insert action asynchronously
          return {isSuccess: true}
        })
  }, () => ({isUnauthorized: true}))
}

module.exports = {
  statements,
  statementJustifications,
  createUser,
  login,
  logout,
  vote,
  unvote,
  createStatement,
  deleteStatement,
  createJustification,
  deleteJustification,
}