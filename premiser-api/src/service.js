const {query, queries} = require('./db')
const {toStatement, toJustification} = require('./orm')
const argon2 = require('argon2')
const uuid = require('uuid');
const moment = require('moment')

const CREATE_USER = 'CREATE_USER'
const authenticationDuration = 'P24H'

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

exports.statementJustifications = (statementId) => queries([
    [
      'select * from statements where statement_id = $1',
      [statementId]
    ],
    [
      `select 
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
                where j.target_type = $1 AND j.target_id = $2`,
      ['STATEMENT', statementId]
    ],
    [
      `select 
                  j.justification_id, 
                  u.* 
                from justifications j 
                  join "references" r ON j.basis_type = 'REFERENCE' AND j.basis_id = r.reference_id
                  join reference_urls USING (reference_id)
                  join urls u USING (url_id)
                  where j.target_type = $1 AND j.target_id = $2
                  order by j.justification_id`,
      ['STATEMENT', statementId]
    ]
  ])
  .then(([{rows: [statement]}, {rows: justifications}, {rows: urls}]) => {
    const urlsByJustificationId = {}
    for (let url of urls) {
      if (!urlsByJustificationId.hasOwnProperty(url.justification_id)) {
        urlsByJustificationId[url.justification_id] = []
      }
      urlsByJustificationId[url.justification_id].push(url)
    }
    return {
      statement: toStatement(statement),
      justifications: justifications.map(j => toJustification(j, urlsByJustificationId[j.justification_id]))
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

        const authenticationToken = uuid.v4()
        const created = new Date()
        const expires = moment().add(authenticationDuration).toDate()
        return query('insert into authentication_tokens (user_id, token, created, expires) values ($1, $2, $3, $4)',
            [userId, authenticationToken, created, expires])
            .then( () => ({authenticationToken, email: credentials.email}) )
      });
    })
}