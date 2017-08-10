const {ArgumentParser} = require('argparse')
const env = require('node-env-file')
const path = require('path')
const Promise = require('bluebird')
const pg = require('pg')
const has = require('lodash/has')
const get = require('lodash/get')
const map = require('lodash/map')
const head = require('lodash/head')
const toNumber = require('lodash/toNumber')
const mysql = require('mysql')

const {normalizeText} = require("../../premiser-api/src/dao/util");
const {JustificationBasisType, JustificationTargetType, JustificationPolarity} = require('../../premiser-api/src/models')

const envFilename = process.env.NODE_ENV === 'production' ? '../config/production-local-tunnel.env' : '../../premiser-api/src/.env'
env(path.join(__dirname, envFilename))

const {query} = require('../../premiser-api/src/db')

env(path.join(__dirname, '../config/old-production.env'), {overwrite: true})


const connection = mysql.createConnection({
  host     : process.env['DB_HOST'],
  database : process.env['DB_NAME'],
  user     : process.env['DB_USER'],
  password : process.env['DB_PASSWORD'],
})

const oldQuery = (sql, args) => Promise.fromCallback(
    callback => {
      console.log('oldQuery ', {sql, args})
      return connection.query(sql, args, (error, results, fields) => callback(error, {rows: results}))
    }
)

const migrate = (connection) => {
  connection.connect();
  return Promise.each([
    migrateUsers,
    migrateStatements,
    migrateCitations,
    migrateUrls,
    migrateCitationUrls,
    migrateRootJustifications,
    migrateRemainingJustifications,
    migrateCompoundJustificationAtoms,
  ], migration => migration())
      .catch(e => {
        console.log("Unhandled error")
        console.log(e)
        throw e
      })
      .finally(() => connection.end())
}

const log = message => {
  console.log(message)
  return Promise.resolve()
}

// Some users had multiple accounts using the same email
const userIdTranslations = {
  1: 18,
  2: 25,
  // This user created one statement and justification, just assign it to me
  3: 18,
  4: 18,
  7: 30,
  24: 25,
  26: 18,
}
const migrateUsers = () => {
  console.log('querying users')
  return oldQuery('select * from auth_user')
      .then( ({rows}) => {
        console.log(`${rows.length} users`)
        return Promise.all(map(rows, row => {
          if (has(userIdTranslations, row.id)) return Promise.resolve()
          const sql = `
            insert into users (email, first_name, last_name, created, last_login) 
            values ($1, $2, $3, $4, $5) 
            returning user_id`
          const args = [row.email, row.first_name, row.last_name, row.date_joined, row.last_login]
          return query(sql, args)
              .then( ({rows: [{user_id}]}) => user_id)
              .then( userId =>
                Promise.all([
                  userId,
                  query(`insert into user_auth (user_id, hash) values ($1, $2) returning user_id`, [userId, row.password]),
                ])
              )
              .then( ([userId]) => {
                return query(
                    'insert into migration_translations (old_table_name, new_table_name, old_id, new_id) values ($1, $2, $3, $4)',
                    ['auth_user', 'users', row.id, userId]
                )
              })
        }))
      })
      .then(() => console.log('users done'))
}

const migrateStatements = () => {
  console.log('querying statements')
  return oldQuery('select * from local_statement')
      .then( ({rows}) => {
        console.log(`${rows.length} statements`)
        return Promise.all(map(rows, row => {
          return getNewUserId(row.creator_id)
              .then( userId => {
                const sql = `
                  insert into statements (text, normal_text, creator_user_id, created) 
                  values ($1, $2, $3, $4) 
                  returning statement_id`
                const args = [row.text, normalizeText(row.text), userId, row.date_created]
                return query(sql, args)
                    .then( ({rows: [{statement_id}]}) => {
                      return query(
                          'insert into migration_translations (old_table_name, new_table_name, old_id, new_id) values ($1, $2, $3, $4)',
                          ['local_statement', 'statements', row.id, statement_id]
                      )
                    })
              })
        }))
      })
}

const migrateCitations = () => {
  console.log('querying citations')
  return oldQuery('select * from local_citation')
      .then( ({rows}) => {
        console.log(`${rows.length} citations`)
        return Promise.all(map(rows, row => {
          return getNewUserId(row.creator_id)
              .then( userId => {
                // The old system duplicated citation descriptions (text). we want to normalize them.
                return query('select * from citations where normal_text = $1', [normalizeText(row.description)])
                    .then( ({rows}) => {
                      const extantRow = head(rows)
                      if (extantRow) {
                        return Promise.all([
                          extantRow.citation_id,
                          query(
                              'insert into migration_translations (old_table_name, new_table_name, old_id, new_id) values ($1, $2, $3, $4)',
                              ['local_citation', 'citations', row.id, extantRow.citation_id]
                          )
                        ])
                      } else {
                        const sql = `
                          insert into citations (text, normal_text, creator_user_id, created) 
                          values ($1, $2, $3, $4) 
                          returning citation_id`
                        const args = [row.description, normalizeText(row.description), userId, row.date_created]
                        return query(sql, args)
                            .then( ({rows: [{citation_id}]}) => {
                              return Promise.all([
                                citation_id,
                                query(
                                    'insert into migration_translations (old_table_name, new_table_name, old_id, new_id) values ($1, $2, $3, $4)',
                                    ['local_citation', 'citations', row.id, citation_id]
                                )
                              ])
                            })
                      }
                    })
                    .then( ([citation_id]) => {
                      const sql = `
                                insert into citation_references (quote, citation_id, creator_user_id, created)
                                values ($1, $2, $3, $4)
                                returning citation_reference_id
                              `
                      return query(sql, [row.quote, citation_id, userId, row.date_created])
                    })
                    .then( ({rows: [{citation_reference_id}]}) => {
                      return query(
                          'insert into migration_translations (old_table_name, new_table_name, old_id, new_id) values ($1, $2, $3, $4)',
                          ['local_citation', 'citation_references', row.id, citation_reference_id]
                      )
                    })


              })
        }))
      })
}

const userIdCache = {}
const getNewUserId = oldUserId => {
  if (!oldUserId) throw new Error('getNewUserId oldUserId is falsy')
  const translatedOldUserId = get(userIdTranslations, oldUserId, oldUserId)
  if (has(userIdCache, translatedOldUserId)) {
    return Promise.resolve(userIdCache[translatedOldUserId])
  }
  return query(
      'select new_id from migration_translations where old_table_name = $1 and new_table_name = $2 and old_id = $3',
      ['auth_user', 'users', translatedOldUserId]
  )
      .then( ({rows: [userMigrateRow]}) => {
        if (!userMigrateRow) {
          throw new Error(`No user migration for ${oldUserId} (translated to ${translatedOldUserId})`)
        }
        userIdCache[translatedOldUserId] = userMigrateRow.new_id
        return userMigrateRow.new_id
      })
}

const migrateUrls = () => {
  console.log('querying URLs')
  // One URL is pentuplicated: http://www.wired.com/gadgets/mac/commentary/cultofmac/2006/01/70072
  return oldQuery('select * from local_url')
      .then( ({rows}) => {
        console.log(`${rows.length} URLs`)
        return Promise.all(map(rows, row => {
          return Promise.all([
            getNewUserId(row.creator_id),
            query('select * from urls where url = $1', [row.url])
          ])
              .then( ([userId, {rows: [urlRow]}]) => {
                if (urlRow) return query(
                    'insert into migration_translations (old_table_name, new_table_name, old_id, new_id) values ($1, $2, $3, $4)',
                    ['local_url', 'urls', row.id, urlRow.url_id]
                )
                return query('insert into urls (url, creator_user_id) values ($1, $2) returning url_id', [row.url, userId])
                    .then( ({rows: [{url_id}]}) => {
                      return query(
                          'insert into migration_translations (old_table_name, new_table_name, old_id, new_id) values ($1, $2, $3, $4)',
                          ['local_url', 'urls', row.id, url_id]
                      )
                    })
              })
        }))
      })
}

const migrateCitationUrls = () => log('migrating citation URLs')
    .then(() => oldQuery('select * from local_citation_urls'))
    .then( ({rows}) => Promise.all(map(rows, row => Promise.all([
          query(
              'select new_id from migration_translations where old_table_name = $1 and new_table_name = $2 and old_id = $3',
              ['local_url', 'urls', row.url_id]
          ),
          query(
              'select new_id from migration_translations where old_table_name = $1 and new_table_name = $2 and old_id = $3',
              ['local_citation', 'citation_references', row.citation_id]
          ),
        ])
        .then( ([{rows: [urlMigrationRow]}, {rows: [citationReferenceMigrationRow]}]) => {
          if (!urlMigrationRow) {
            throw new Error(`No URL migrated having old ID ${row.url_id}`)
          }
          if (!citationReferenceMigrationRow) {
            throw new Error(`No citation reference migrated from old citation having ID ${row.citation_id}`)
          }
          const urlId = urlMigrationRow.new_id,
              citationReferenceId = citationReferenceMigrationRow.new_id

          return query('insert into citation_reference_urls (citation_reference_id, url_id) values ($1, $2)', [citationReferenceId, urlId])
              .then(() => query(
                  'insert into migration_translations (old_table_name, new_table_name, old_id, new_id) values ($1, $2, $3, $4)',
                  ['local_citation_urls', 'citation_reference_urls', row.id, citationReferenceId + '-' + urlId]
              ))
        })
    )))

const getRootStatementId = row => {
  if (row.statement_id) {
    return query('select new_id from migration_translations where old_table_name = $1 and new_table_name = $2 and old_id = $3',
        ['local_statement', 'statements', row.statement_id])
        .then( ({rows: [migrationRow]}) => {
          if (!migrationRow) {
            throw new Error(`no statement migrated for old statement ID ${row.statement_id}`)
          }
          return migrationRow.new_id
        })
  }
  if (!row.justification_id) throw new Error(`justification ${row.id} has neither statement_id nor justification_id`)
  return oldQuery('select * from local_justification where id = ?', [row.justification_id])
      .then( ({rows: [targetRow]}) => {
        if (!targetRow) throw new Error(`justification ${row.id} targets justification ${row.justification_id}, which was not found`)
        return getRootStatementId(targetRow)
      })
}

const getRootPositive = row => {
  if (row.statement_id) {
    return row.positive
  }
  if (!row.justification_id) throw new Error(`justification ${row.id} has neither statement_id nor justification_id`)
  return oldQuery('select * from local_justification where id = ?', [row.justification_id])
      .then( ({rows: [targetRow]}) => {
        if (!targetRow) throw new Error(`justification ${row.id} targets justification ${row.justification_id}, which was not found`)
        return getRootPositive(targetRow)
      })
}

const getJustificationTargetId = row => Promise.resolve()
    .then(() => {
      if (row.statement_id) {
        return query(
            'select new_id from migration_translations where old_table_name = $1 and new_table_name = $2 and old_id = $3',
            ['local_statement', 'statements', row.statement_id]
        )
      }
      if (row.justification_id) {
        return query(
            'select new_id from migration_translations where old_table_name = $1 and new_table_name = $2 and old_id = $3',
            ['local_justification', 'justifications', row.justification_id]
        )
      }
    })
    .then( ({rows: [targetRow]}) => {
      if (!targetRow) {
        const targetType = row.statement_id ? JustificationTargetType.STATEMENT : JustificationTargetType.JUSTIFICATION
        throw new Error(`justification ${row.id} is missing migrated target ID for ${targetType} ${row.statement_id || row.justification_id}`)
      }
      return targetRow.new_id
    })

const migrateRootJustifications = () => log('migrate root justifications')
    .then(() => oldQuery('select * from local_justification where statement_id is not null'))
    .then(migrateJustifications)
const migrateRemainingJustifications = () => log('migrate remaining justifications')
    .then(() => oldQuery(`
        -- select justifications that target a migrated justification, but which haven't been migrated yet
        select * 
        from local_justification j 
          join migration_translations t1 on
                t1.old_table_name = 'local_justification'
            and t1.new_table_name = 'justifications'
            and j.justification_id = t1.old_id
          left join migration_translations t2 on
                t2.old_id = j.id
            and t2.old_table_name= 'local_justification'
            and t2.new_table_name = 'justifications'
          where t2.old_id is null
        `))
    .then( ({rows}) => {
      if (rows.length > 0) {
        return migrateJustifications({rows})
            .then(migrateRemainingJustifications)
      }
      return Promise.resolve()
    })

migrateJustificationBasis = (row) => {
  if (row.citation_id) {
    return migrateCitationJustificationBasis(row)
  } else if (row.justifying_statement_id) {
    return migrateStatementJustificationBasis(row)
  } else {
    return migrateCompoundJustificationBasis(row)
  }
}

const migrateCitationJustificationBasis = row =>
    query(
        'select new_id from migration_translations where old_table_name = $1 and new_table_name = $2 and old_id = $3',
        ['local_citation', 'citation_references', row.citation_id]
    )
    .then( ({rows: [basisMigrationRow]}) => {
      if (!basisMigrationRow) {
        throw new Error(`justification ${row.id} is missing migrated citation_reference for citation ${row.citation_id}`)
      }
      return basisMigrationRow.new_id
    })

const migrateStatementJustificationBasis = row =>
    Promise.all([
      query(
          'select new_id from migration_translations where old_table_name = $1 and new_table_name = $2 and old_id = $3',
          ['local_statement', 'statements', row.justifying_statement_id]
      ),
      getNewUserId(row.creator_id),
    ])
    .then( ([{rows: [statementMigrationRow]}, userId]) => {
      if (!statementMigrationRow) {
        throw new Error(`justification ${row.id} is missing migrated statement ${row.justifying_statement_id}`)
      }
      return [statementMigrationRow.new_id, userId]
    })
    .then( ([statementId, userId]) => {
      return query('insert into statement_compounds (creator_user_id, created) values ($1, $2) returning statement_compound_id', [userId, row.date_created])
          .then( ({rows: [{statement_compound_id}]}) => Promise.all([
            statement_compound_id,
            query('insert into migration_translations (old_table_name, new_table_name, old_id, new_id) values ($1, $2, $3, $4)',
                ['local_statement', 'statement_compounds', row.justifying_statement_id, statement_compound_id]),
            query('insert into statement_compound_atoms (statement_compound_id, statement_id, order_position) values ($1, $2, $3)',
                [statement_compound_id, statementId, 0])
          ]))
          .then( ([statementCompoundId]) => statementCompoundId)
    })

const migrateCompoundJustificationBasis = row => {
  return getNewUserId(row.creator_id)
      .then(userId =>
          query('insert into statement_compounds (creator_user_id, created) values ($1, $2) returning statement_compound_id', [userId, row.date_created])
      )
      .then( ({rows: [{statement_compound_id}]}) => Promise.all([
        statement_compound_id,
        query('insert into migration_translations (old_table_name, new_table_name, old_id, new_id) values ($1, $2, $3, $4)',
            ['local_justification', 'statement_compounds', row.id, statement_compound_id]),
      ]))
      .then( ([statement_compound_id]) => statement_compound_id)
}

const migrateJustifications = ({rows}) => Promise.all(map(rows, row => Promise.all([
      migrateJustificationBasis(row),
      row.citation_id ? JustificationBasisType.CITATION_REFERENCE : JustificationBasisType.STATEMENT_COMPOUND,
      getJustificationTargetId(row),
      row.statement_id ? JustificationTargetType.STATEMENT : JustificationTargetType.JUSTIFICATION,
      getNewUserId(row.creator_id),
      getRootStatementId(row),
      getRootPositive(row),
    ])
    .then( ([basisId, basisType, targetId, targetType, userId, rootStatementId, rootPositive]) => {
      const polarity = row.positive === 0 ? JustificationPolarity.NEGATIVE : JustificationPolarity.POSITIVE
      const rootPolarity = rootPositive === 0 ? JustificationPolarity.NEGATIVE : JustificationPolarity.POSITIVE
      return query(
          `insert into justifications (root_statement_id, root_polarity, target_id, target_type, basis_id, basis_type, polarity, creator_user_id, created) 
                values ($1, $2, $3, $4, $5, $6, $7, $8)
                returning justification_id`,
          [rootStatementId, rootPolarity, targetId, targetType, basisId, basisType, polarity, userId, row.date_created]
      )
          .then( ({rows: [{justification_id}]}) => Promise.all([
              query(
                  'insert into migration_translations (old_table_name, new_table_name, old_id, new_id) values ($1, $2, $3, $4)',
                  ['local_justification', 'justifications', row.id, justification_id]
              ),
              oldQuery(
                  'insert into migration_translations (old_table_name, new_table_name, old_id, new_id) values (?, ?, ?, ?)',
                  ['local_justification', 'justifications', row.id, justification_id]
              )
          ]))
    })))

const migrateCompoundJustificationAtoms = () => log('migrating compound justifications atoms')
    .then(() => oldQuery('select * from local_justification_atoms'))
    .then( ({rows}) => Promise.all(map(rows, row => {
      // 75 and 76 are atoms to 77.  The table incorrectly has both entries to the atoms from 77 and to 77 from both of the atoms.
      // So ignore atom entries from either 75 or 76 to 77
      if (toNumber(row.from_justification_id) === 75 || toNumber(row.from_justification_id === 76)) return Promise.resolve()
      return Promise.all([
        query(
            'select new_id from migration_translations where old_table_name = $1 and new_table_name = $2 and old_id = $3',
            ['local_justification', 'statement_compounds', row.from_justification_id]
        ),
        oldQuery('select justifying_statement_id from local_justification where id = ?', [row.to_justification_id]),
      ])
          .then( ([{rows: [statementCompoundMigrationRow]}, {rows: [oldStatementIdRow]}]) => {
            if (!statementCompoundMigrationRow) throw new Error(`No statement compound was migrated for old justification ${row.from_justification_id})`)
            if (!oldStatementIdRow) throw new Error(`No justification was migrated for old justification atom ${row.to_justification_id}`)
            return Promise.all([
              statementCompoundMigrationRow.new_id,
              query(
                  'select new_id from migration_translations where old_table_name = $1 and new_table_name = $2 and old_id = $3',
                  ['local_statement', 'statements', oldStatementIdRow.justifying_statement_id]
              ),
              oldStatementIdRow.justifying_statement_id,
            ])

          })
          .then( ([statementCompoundId, {rows: [statementMigrationRow]}, oldStatementId]) => {
            if (!statementMigrationRow) throw new Error(`No statement was migrated for ${oldStatementId}`)
            const statementId = statementMigrationRow.new_id
            return query('insert into statement_compound_atoms (statement_compound_id, statement_id) values ($1, $2)', [statementCompoundId, statementId])
          })
        }
    )))

migrate(connection).then(() => {
  console.log('All done')
})