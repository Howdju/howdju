const {query, queries} = require('./db')
const {toStatement, toJustification, toVote} = require('./orm')
const argon2 = require('argon2')
const cryptohat = require('cryptohat')
const uuid = require('uuid');
const moment = require('moment')

const config = require('./config')
const {assert} = require('./util')
const {logger} = require('./logger')

const {JustificationTargetType, VotePolarity, VoteTargetType} = require('./models')

const CREATE_USER = 'CREATE_USER'

const withPermission = (permission, authToken) => query(`
    select true as is_authorized
    from authentication_tokens auth
      join users u USING (user_id)
      join permissions p USING (user_id)
      where auth.token = $1 and p.permission_name = $2 and auth.expires > $3 and auth.deleted IS NULL 
`, [authToken, permission, new Date()])
    // TODO does this work deconstructing the first row?  What happen when it is empty?
    .then(({rows: [isAuthorized]}) => isAuthorized ? Promise.resolve() : Promise.reject())

exports.statements = () => query('select * from statements')
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

exports.statementJustifications = ({statementId, authToken}) => queries([
    {
      // Statement
      query: 'select * from statements where statement_id = $1',
      args: [statementId],
    },
    {
      // Justifications
      query: `select 
                j.*
                , s.text as basis_statement_text
                , r.reference_id as basis_reference_id
                , r.quote as basis_reference_quote
                , c.citation_id as basis_reference_citation_id
                , c.text as basis_reference_citation_text
                , v.vote_id
                , v.polarity AS vote_polarity
                , v.target_type AS vote_target_type
                , v.target_id AS vote_target_id
              from justifications j 
                left join statements s ON j.basis_type = 'STATEMENT' AND j.basis_id = s.statement_id
                left join "references" r ON j.basis_type = 'REFERENCE' AND j.basis_id = r.reference_id
                left join citations c USING (citation_id)
                left join authentication_tokens auth ON auth.token = $2
                left join votes v ON 
                      v.target_type = $3
                  and j.justification_id = v.target_id
                  and v.user_id = auth.user_id
                  and v.deleted IS NULL
                where 
                  j.root_statement_id = $1`,
      args: [statementId, authToken, VoteTargetType.JUSTIFICATION]
    },
    {
      // Urls
      query: `select 
                    j.justification_id, 
                    u.* 
                  from justifications j 
                    join "references" r ON j.basis_type = 'REFERENCE' AND j.basis_id = r.reference_id
                    join reference_urls USING (reference_id)
                    join urls u USING (url_id)
                    where j.root_statement_id = $1
                    order by j.justification_id`,
      args: [statementId]
    }
  ])
  .then(([{rows: [statement]}, {rows: justifications}, {rows: urls}]) => {
    const urlsByJustificationId = collectUrls(urls)
    const {rootJustifications, counterJustificationsByJustificationId} =
        collectJustifications(statement.statement_id, justifications)
    return {
      statement: toStatement(statement),
      justifications: rootJustifications.map(j => toJustification(j, urlsByJustificationId,
          counterJustificationsByJustificationId))
    }
  })

exports.createUser = ({user: {email, password}, authorizationToken}) => {
  withPermission(CREATE_USER, authorizationToken).then(
      () => {
        argon2.generateSalt().then(salt => {
          argon2.hash(password, salt)
              .then( hash => query('insert into users (email, hash) values ($1, $2) returning user_id', [email, hash]) )
              .then( ({rows: [{user_id: id}]}) => ({user: {email, id}}) )
        })
      },
      () => ({notAuthorized: true, message: 'insufficient permissions'})
  )
}

exports.login = ({credentials}) => {
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

exports.logout = ({authToken}) => query('delete from authentication_tokens where token = $1', [authToken])

exports.vote = ({authToken, targetType, targetId, polarity}) => {
  logger.silly('In vote!')
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

exports.unvote = ({authToken, targetType, targetId, polarity}) => {
  logger.silly('In unvote!')
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

      return {message: 'Deleted vote'}
    })
  })
}
