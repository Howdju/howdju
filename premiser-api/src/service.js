const {query, queries} = require('./db')
const {toStatement, toJustification} = require('./orm')
const argon2 = require('argon2')
const cryptohat = require('cryptohat')
const uuid = require('uuid');
const moment = require('moment')

const config = require('./config')
const {assert} = require('./util')

const {JustificationTargetType} = require('./models')

const CREATE_USER = 'CREATE_USER'

const withPermission = (permission, authenticationToken) => query(`
    select true as is_authorized
    from authentication_tokens at
      join users u USING (user_id)
      join permissions p USING (user_id)
      where at.token = $1 and p.permission_name = $2 and at.expires > $3 and at.deleted IS NULL 
`, [authenticationToken, permission, new Date()])
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

exports.statementJustifications = (statementId) => queries([
    {
      // Statement
      query: 'select * from statements where statement_id = $1',
      args: [statementId],
    },
    {
      // Justifications
      query: `select 
                  j.*,
                  s.text as basis_statement_text,
                  r.reference_id as basis_reference_id,
                  r.quote as basis_reference_quote,
                  c.citation_id as basis_reference_citation_id,
                  c.text as basis_reference_citation_text
                from justifications j 
                  left join statements s ON j.basis_type = 'STATEMENT' AND j.basis_id = s.statement_id
                  left join "references" r ON j.basis_type = 'REFERENCE' AND j.basis_id = r.reference_id
                  left join citations c USING (citation_id)
                  where j.root_statement_id = $1`,
      args: [statementId]
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
              .then( ({rows: [{userId}]}) => ({user: {email, id: userId}}) )
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
    .then(({rows: [user]}) => {
      if (!user) {
        return {isNotFound: true, message: 'the email does not exist'}
      }
      const {user_id: userId, hash} = user
      return argon2.verify(hash, credentials.password).then(match => {
        if (!match) return {isNotAuthorized: true, message: 'invalid credentials'}

        const authenticationToken = cryptohat(256, 36)
        const created = new Date()
        const expires = moment().add(moment.duration.apply(moment.duration, config.authenticationTokenDuration)).toDate()
        return query('insert into authentication_tokens (user_id, token, created, expires) values ($1, $2, $3, $4)',
            [userId, authenticationToken, created, expires])
            .then( () => ({
              auth: {
                authenticationToken,
                email: credentials.email
                // tokenType, expiresIn, refreshToken (another token)
              }
            }) )
      });
    })
}

exports.logout = ({authenticationToken}) => query('delete from authentication_tokens where token = $1', [authenticationToken])