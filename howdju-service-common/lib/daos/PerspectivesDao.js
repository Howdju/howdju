const forEach = require('lodash/forEach')
const map = require('lodash/map')

const {
  VoteTargetType,
  JustificationBasisType,
  JustificationTargetType,
  newImpossibleError,
} = require('howdju-common')

const {
  toPerspective,
  toJustification,
  toStatementCompound,
  toStatement,
  toStatementCompoundAtom,
  toUrl,
  toWriting,
  toWritingQuote,
} = require('./orm')


exports.PerspectivesDao = class PerspectivesDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  /** All justifications must be included in the perspective.
   *
   * See <premiser-processing>/src/perspectiveService for a more complicated approach of inferring included justifications
   * across root statement boundaries, but that has the added difficulties of multiple paths from perspective-justification
   * to perspective-statement.
   */
  readFeaturedPerspectivesWithVotesForOptionalUserId(userId) {
    const args = [
      JustificationBasisType.STATEMENT_COMPOUND,
      JustificationBasisType.WRITING_QUOTE
    ]
    if (userId) {
      args.push(VoteTargetType.JUSTIFICATION)
      args.push(userId)
    }

    const votesSelectSql = userId ? `
        , v.vote_id
        , v.polarity AS vote_polarity
        , v.target_type AS vote_target_type
        , v.target_id AS vote_target_id
        ` :
      ''
    const votesJoinSql = userId ? `
        left join votes v on 
              v.target_type = $3
          and j.justification_id = v.target_id
          and v.user_id = $4
          and v.deleted IS NULL
        ` :
      ''
    const perspectiveJustificationsSql = `
      select 
          p.perspective_id
        , p.creator_user_id         as perspective_creator_user_id
        , p.statement_id            as perspective_statement_id
        , ps.text                   as perspective_statement_text
        , ps.creator_user_id        as perspective_statement_creator_user_id
        , ps.created                as perspective_statement_created
        , j.*
        , sc.statement_compound_id  as basis_statement_compound_id
        , sca.statement_id          as basis_statement_compound_atom_statement_id
        , sca.order_position        as basis_statement_compound_atom_order_position
        , scas.text                 as basis_statement_compound_atom_statement_text
        , scas.created              as basis_statement_compound_atom_statement_created
        , scas.creator_user_id      as basis_statement_compound_atom_statement_creator_user_id
        , wq.writing_quote_id       as basis_writing_quote_id
        , wq.quote_text             as basis_writing_quote_quote_text
        , w.writing_id              as basis_writing_quote_writing_id
        , w.title                   as basis_writing_quote_writing_title
        , cru.url_id                as basis_writing_quote_url_id
        , u.url                     as basis_writing_quote_url_url
        ${votesSelectSql}
      from perspectives p 
        join statements ps on 
              p.is_featured
          and p.statement_id = ps.statement_id
          and p.deleted is null
          and ps.deleted is null
        join perspective_justifications pj on
              p.perspective_id = pj.perspective_id
        join justifications j on
              j.deleted is null
          and pj.justification_id = j.justification_id
          
        left join statement_compounds sc on
              j.basis_type = $1
          and j.basis_id = sc.statement_compound_id
          and sc.deleted is null
        left join statement_compound_atoms sca on
              sc.statement_compound_id = sca.statement_compound_id
        left join statements scas on
              sca.statement_id = scas.statement_id
          and scas.deleted is null
          
        left join writing_quotes wq on
              j.basis_type = $2
          and j.basis_id = wq.writing_quote_id
          and wq.deleted is null
        left join writings w on
              wq.writing_id = w.writing_id
          and w.deleted is null
        left join writing_quote_urls cru on
             wq.writing_quote_id = cru.writing_quote_id
         and cru.deleted is null
        left join urls u on
              cru.url_id = u.url_id
          and u.deleted is null
        ${votesJoinSql}
        order by sca.order_position
    `
    return this.database.query(perspectiveJustificationsSql, args)
      .then( ({rows}) => this._postProcessRows(rows))
  }

  _postProcessRows(rows) {
    const {
      perspectivesById,
      justificationsById,
      statementCompoundsById,
      statementCompoundAtomsByStatementCompoundId,
      statementsById,
      writingQuotesById,
      writingsById,
      urlsByWritingQuoteId,
    } = this._indexRows(rows)

    this._connectEverything(
      perspectivesById,
      justificationsById,
      statementCompoundsById,
      statementCompoundAtomsByStatementCompoundId,
      statementsById,
      writingQuotesById,
      writingsById,
      urlsByWritingQuoteId
    )

    return map(perspectivesById, p => p)
  }

  _indexRows(rows) {
    const perspectivesById = {}
    const justificationsById = {}
    const statementCompoundsById = {}
    const statementCompoundAtomsByStatementCompoundId = {}
    const statementsById = {}
    const writingQuotesById = {}
    const writingsById = {}
    const urlsById = {}
    const urlsByWritingQuoteId = {}

    forEach(rows, row => {

      let perspective = perspectivesById[row.perspective_id]
      if (!perspective) {
        perspectivesById[row.perspective_id] = perspective = toPerspective({
          perspective_id: row.perspective_id,
          creator_user_id: row.perspective_creator_user_id,
          statement_id: row.perspective_statement_id,
        })
      }
      let perspectiveStatement = statementsById[perspective.statement.id]
      if (!perspectiveStatement) {
        statementsById[perspective.statement.id] = toStatement({
          statement_id: row.perspective_statement_id,
          text: row.perspective_statement_text,
          creator_user_id: row.perspective_statement_creator_user_id,
          created: row.perspectivce_statement_created,
        })
      }

      const justification = justificationsById[row.justification_id]
      if (!justification) {
        justificationsById[row.justification_id] = toJustification(row)
      }

      if (row.basis_statement_compound_id) {
        let statementCompound = statementCompoundsById[row.basis_statement_compound_id]
        if (!statementCompound) {
          statementCompoundsById[row.basis_statement_compound_id] = statementCompound = toStatementCompound({
            statement_compound_id: row.basis_statement_compound_id
          })
        }

        let statementCompoundAtoms = statementCompoundAtomsByStatementCompoundId[statementCompound.id]
        if (!statementCompoundAtoms) {
          statementCompoundAtomsByStatementCompoundId[statementCompound.id] = statementCompoundAtoms = []
        }
        const statementCompoundAtom = toStatementCompoundAtom({
          statement_compound_id: statementCompound.id,
          statement_id: row.basis_statement_compound_atom_statement_id,
          order_position: row.basis_statement_compound_atom_order_position,
        })
        statementCompoundAtoms.push(statementCompoundAtom)

        const statement = statementsById[statementCompoundAtom.statement.id]
        if (!statement) {
          statementsById[statementCompoundAtom.statement.id] = toStatement({
            statement_id: statementCompoundAtom.statement.id,
            text: row.basis_statement_compound_atom_statement_text,
            creator_user_id: row.basis_statement_compound_atom_statement_creator_user_id,
            created: row.basis_statement_compound_atom_statement_created,
          })
        }
      }

      if (row.basis_writing_quote_id) {
        let writingQuote = writingQuotesById[row.basis_writing_quote_id]
        if (!writingQuote) {
          writingQuotesById[row.basis_writing_quote_id] = writingQuote = toWritingQuote({
            writing_quote_id: row.basis_writing_quote_id,
            writing_id: row.basis_writing_quote_writing_id,
            quote_text: row.basis_writing_quote_quote_text,
          })
        }

        const writing = writingsById[writingQuote.writing.id]
        if (!writing) {
          writingsById[row.basis_writing_quote_writing_id] = toWriting({
            writing_id: row.basis_writing_quote_writing_id,
            title: row.basis_writing_quote_writing_title
          })
        }

        if (row.basis_writing_quote_url_id) {
          let url = urlsById[row.basis_writing_quote_url_id]
          if (!url) {
            urlsById[row.basis_writing_quote_url_id] = url = toUrl({
              url_id: row.basis_writing_quote_url_id,
              url: row.basis_writing_quote_url_url
            })
          }
          let urls = urlsByWritingQuoteId[writingQuote.id]
          if (!urls) {
            urlsByWritingQuoteId[writingQuote.id] = urls = []
          }
          urls.push(url)
        }
      }
    })

    return {
      perspectivesById,
      justificationsById,
      statementCompoundsById,
      statementCompoundAtomsByStatementCompoundId,
      statementsById,
      writingQuotesById,
      writingsById,
      urlsByWritingQuoteId,
    }
  }

  _connectEverything(
    perspectivesById,
    justificationsById,
    statementCompoundsById,
    statementCompoundAtomsByStatementCompoundId,
    statementsById,
    writingQuotesById,
    writingsById,
    urlsByWritingQuoteId
  ) {
    forEach(perspectivesById, p => {
      p.statement = statementsById[p.statement.id]
    })

    forEach(justificationsById, j => {

      j.rootStatement = statementsById[j.rootStatement.id]

      switch (j.target.type) {
        case JustificationTargetType.STATEMENT: {
          const targetStatement = statementsById[j.target.entity.id]
          j.target.entity = targetStatement
          if (!targetStatement.justifications) {
            targetStatement.justifications = []
          }
          targetStatement.justifications.push(j)
        }
          break
        case JustificationTargetType.JUSTIFICATION: {
          const targetJustification = justificationsById[j.target.entity.id]
          j.target.entity = targetJustification
          targetJustification.counterJustifications.push(j)
        }
          break
        default:
          throw newImpossibleError(`justification ${j.id} has unsupported target type ${j.target.type}`)
      }

      switch (j.basis.type) {
        case JustificationBasisType.STATEMENT_COMPOUND: {
          j.basis.entity = statementCompoundsById[j.basis.entity.id]
        }
          break
        case JustificationBasisType.WRITING_QUOTE: {
          j.basis.entity = writingQuotesById[j.basis.entity.id]
        }
          break
        default:
          throw newImpossibleError(`justification ${j.id} has unsupported basis type ${j.target.type}`)
      }
    })

    forEach(statementCompoundsById, sc => {
      sc.atoms = statementCompoundAtomsByStatementCompoundId[sc.id]
    })

    forEach(statementCompoundAtomsByStatementCompoundId, scas =>
      forEach(scas, sca => {
        sca.statement = statementsById[sca.statement.id]
      })
    )

    forEach(writingQuotesById, wq => {
      wq.writing = writingsById[wq.writing.id]
      wq.urls = urlsByWritingQuoteId[wq.id]
    })
  }
}
