const concat = require('lodash/concat')
const forEach = require('lodash/forEach')
const head = require('lodash/head')
const map = require('lodash/map')
const Promise = require('bluebird')
const snakeCase = require('lodash/snakeCase')

const {
  toWritingQuote,
  toWritingQuoteUrl,
  toUrl,
} = require('./orm')

const {
  JustificationBasisType,
  VoteTargetType,
  SortDirection,
  ContinuationSortDirection,
  JustificationTargetType,
} = require('howdju-common')
const {DatabaseSortDirection} = require('./daoModels')


exports.WritingQuotesDao = class WritingQuotesDao {

  constructor(logger, database, urlsDao) {
    this.logger = logger
    this.database = database
    this.urlsDao = urlsDao
  }

  read(writingQuoteId) {
    return Promise.all([
      this.database.query(`
        select 
            wq.writing_quote_id
          , wq.quote_text
          , w.writing_id
          , w.title as writing_title
        from writing_quotes wq join writings w on 
              wq.writing_quote_id = $1
          and wq.writing_id = w.writing_id
          and wq.deleted is null
          and w.deleted is null
          `, [writingQuoteId]),
      this.readUrlsByWritingQuoteId(writingQuoteId)
    ])
      .then( ([
        {rows: [row]},
        urls,
      ]) => {
        const writingQuote = toWritingQuote(row)
        writingQuote.urls = urls
        return writingQuote
      })
  }

  readWritingQuotes(sorts, count) {
    const args = []
    let countSql = ''
    if (isFinite(count)) {
      args.push(count)
      countSql = `limit $${args.length}`
    }

    const whereSqls = [
      'wq.deleted is null',
      'w.deleted is null',
    ]
    const orderBySqls = []
    forEach(sorts, sort => {
      const columnName = sort.property === 'id' ? 'writing_quote_id' : snakeCase(sort.property)
      const direction = sort.direction === SortDirection.DESCENDING ?
        DatabaseSortDirection.DESCENDING :
        DatabaseSortDirection.ASCENDING
      whereSqls.push(`wq.${columnName} is not null`)
      orderBySqls.push(`wq.${columnName} ${direction}`)
    })
    const whereSql = whereSqls.join('\nand ')
    const orderBySql = orderBySqls.length > 0 ? 'order by ' + orderBySqls.join(',') : ''

    const sql = `
      select 
          wq.*
        , w.title as writing_title
        , w.created as writing_created
      from writing_quotes wq
          join writings w USING (writing_id)
        where 
          ${whereSql}
      ${orderBySql}
      ${countSql}
      `
    return this.database.query(sql, args)
      .then(({rows}) => map(rows, toWritingQuote))
  }

  readMoreWritingQuotes(sortContinuations, count) {
    const args = []
    let countSql = ''
    if (isFinite(count)) {
      args.push(count)
      countSql = `\nlimit $${args.length}`
    }

    const whereSqls = [
      'wq.deleted is null',
      'w.deleted is null',
    ]
    const continuationWhereSqls = []
    const prevWhereSqls = []
    const orderBySqls = []
    forEach(sortContinuations, (sortContinuation) => {
      const value = sortContinuation.v
      // The default direction is ascending
      const direction = sortContinuation.d === ContinuationSortDirection.DESCENDING ?
        DatabaseSortDirection.DESCENDING :
        DatabaseSortDirection.ASCENDING
      // 'id' is a special property name for entities. The column is prefixed by the entity type
      const columnName = sortContinuation.p === 'id' ? 'writing_quote_id' : snakeCase(sortContinuation.p)
      let operator = direction === 'asc' ? '>' : '<'
      args.push(value)
      const currContinuationWhereSql = concat(prevWhereSqls, [`wq.${columnName} ${operator} $${args.length}`])
      continuationWhereSqls.push(currContinuationWhereSql.join(' and '))
      prevWhereSqls.push(`wq.${columnName} = $${args.length}`)
      whereSqls.push(`wq.${columnName} is not null`)
      orderBySqls.push(`wq.${columnName} ${direction}`)
    })

    const continuationWhereSql = continuationWhereSqls.join('\n or ')
    const whereSql = whereSqls.join('\nand ')
    const orderBySql = orderBySqls.length > 0 ? 'order by ' + orderBySqls.join(',') : ''

    const sql = `
      select 
          wq.*
        , w.title as writing_title
        , w.created as writing_created
      from writing_quotes wq
          join writings w using (writing_id)
        where 
          ${whereSql}
        and (
          ${continuationWhereSql}
        )
      ${orderBySql}
      ${countSql}
      `
    return this.database.query(sql, args)
      .then( ({rows}) => map(rows, toWritingQuote) )
  }

  readWritingQuotesByIdForRootStatementId(rootStatementId) {
    const sql = `
      select 
          wq.writing_quote_id
        , wq.quote_text
        , w.writing_id
        , w.title as writing_title
      from justifications j 
          join writing_quotes wq on 
                j.root_statement_id = $1
            and j.basis_type = $2
            and j.deleted is null
            and j.basis_id = wq.writing_quote_id
          join writings w using (writing_id)
      `
    return Promise.all([
      this.database.query(sql, [rootStatementId, JustificationBasisType.WRITING_QUOTE]),
      this.urlsDao.readUrlsByWritingQuoteIdForRootStatementId(rootStatementId)
    ])
      .then( ([
        {rows},
        urlsByWritingQuoteId
      ]) => {
        const writingQuotesById = {}
        forEach(rows, row => {
          const writingQuote = toWritingQuote(row)
          const writingQuoteId = row.writing_quote_id
          writingQuote.urls = urlsByWritingQuoteId[writingQuoteId]
          writingQuotesById[writingQuoteId] = writingQuote
        })
        return writingQuotesById
      })
  }

  readWritingQuotesEquivalentTo(writingQuote) {
    // Empty strings should be stored as null quotes
    const quoteText = writingQuote.quoteText || null
    // Could also let the writing.title be missing and just look up by ID
    return this.database.query(`
      select * 
      from writing_quotes wq join writings w on 
            wq.writing_id = w.writing_id
        and case when $1::varchar is null then w.writing_id = $2 else w.title = $1 end
        and case when $3::varchar is null then wq.quote_text is null else wq.quote_text = $3 end
        and w.deleted is null
        and wq.deleted is null 
      `,
      [writingQuote.writing.title, writingQuote.writing.id, quoteText]
    )
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`${rows.length} equivalent writings`, writingQuote)
        }
        return toWritingQuote(head(rows))
      })
  }

  readWritingQuoteUrlsForWritingQuote(writingQuote) {
    return this.database.query('select * from writing_quote_urls where writing_quote_id = $1 and deleted is null',
      [writingQuote.id])
      .then( ({rows}) => map(rows, toWritingQuoteUrl) )
  }

  readWritingQuoteUrl(writingQuote, url) {
    return this.database.query('select * from writing_quote_urls where writing_quote_id = $1 and url_id = $2 and deleted is null',
      [writingQuote.id, url.id])
      .then( ({rows}) => {
        if (rows.length > 1) {
          this.logger.error(`URL ${url.id} is associated with writing quote ${writingQuote.id} multiple times`)
        }
        return toWritingQuoteUrl(head(rows))
      })
  }

  createWritingQuoteUrls(writingQuote, urls, userId, now) {
    return Promise.all(map(urls, url => this.createWritingQuoteUrl(writingQuote, url, userId, now)))
  }

  createWritingQuoteUrl(writingQuote, url, userId, now) {
    return this.database.query(`
      insert into writing_quote_urls (writing_quote_id, url_id, creator_user_id, created) 
      values ($1, $2, $3, $4)
      returning *
      `,
      [writingQuote.id, url.id, userId, now]
    )
      .then( ({rows}) => map(rows, toWritingQuoteUrl))
  }

  createWritingQuote(writingQuote, userId, now) {
    const sql = `
      insert into writing_quotes (quote_text, writing_id, creator_user_id, created) 
      values ($1, $2, $3, $4) 
      returning *
    `
    // Don't insert an empty quote
    const quoteText = writingQuote.quoteText || null
    return this.database.query(sql, [quoteText, writingQuote.writing.id, userId, now])
      .then( ({rows: [row]}) => toWritingQuote(row))
  }

  hasEquivalentWritingQuotes(writingQuote) {
    const sql = `
      select count(*) > 0 has_conflict 
      from writing_quotes wq join writings w using (writing_id)
        where 
              wq.writing_quote_id != $1 
          and (wq.writing_id = $3 or w.title = $4)
          and wq.quote_text = $2
          and wq.deleted is null
          and w.deleted is null
      `
    const args = [writingQuote.id, writingQuote.quoteText, writingQuote.writing.id, writingQuote.writing.title]
    return this.database.query(sql, args)
      .then( ({rows: [{has_conflict}]}) => has_conflict)
  }

  hasWritingQuoteChanged(writingQuote) {
    const sql = `
      select count(*) < 1 as has_changed 
      from writing_quotes 
        where writing_quote_id = $1 and quote_text = $2
      `
    return this.database.query(sql, [writingQuote.id, writingQuote.quoteText])
      .then( ({rows: [{has_changed}]}) => has_changed )
  }

  readUrlsByWritingQuoteId(writingQuoteId) {
    return this.database.query(`
      select u.* 
      from urls u join writing_quote_urls wqu using (url_id) 
        where 
                wqu.writing_quote_id = $1
            and u.deleted is null
            and wqu.deleted is null
      `, [writingQuoteId])
      .then( ({rows}) => map(rows, toUrl))
  }

  isBasisToJustificationsHavingOtherUsersVotes(userId, writingQuote) {
    const sql = `
      with
        basis_justifications as (
          select *
          from justifications
            where basis_type = $1 and basis_id = $2 and deleted is null
        )
        , basis_justification_votes as (
          select * from votes v
            join basis_justifications j on
                  v.user_id != $3
              and v.target_type = $4 
              and v.target_id = j.justification_id
              and v.deleted is null
        )
      select count(*) > 0 as has_votes from basis_justification_votes
    `
    return this.database.query(sql, [
      JustificationBasisType.WRITING_QUOTE,
      writingQuote.id,
      userId,
      VoteTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_votes: isBasisToJustificationsHavingOtherUsersVotes}]}) => isBasisToJustificationsHavingOtherUsersVotes)
  }

  isBasisToOtherUsersJustifications(userId, writingQuote) {
    const sql = `
      select count(*) > 0 as has_other_users_justifications 
      from justifications where 
            basis_type = $1 
        and basis_id = $2 
        and creator_user_id != $3
        and deleted is null
        `
    return this.database.query(sql, [
      JustificationBasisType.WRITING_QUOTE,
      writingQuote.id,
      userId,
    ]).then( ({rows: [{has_other_users_justifications: isBasisToOtherUsersJustifications}]}) => isBasisToOtherUsersJustifications)
  }

  isBasisToJustificationsHavingOtherUsersCounters(userId, writingQuote) {
    const sql = `
      with
        basis_justifications as (
          select *
          from justifications
            where basis_type = $1 and basis_id = $2 and deleted is null
        )
        , counters as (
          select * from justifications cj join basis_justifications j on 
                cj.creator_user_id != $3 
            and cj.target_type = $4 
            and cj.target_id = j.justification_id
            and cj.deleted is null
        )
      select count(*) > 0 as has_other_user_counters from counters
    `
    return this.database.query(sql, [
      JustificationBasisType.WRITING_QUOTE,
      writingQuote.id,
      userId,
      JustificationTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_other_user_counters: isBasisToJustificationsHavingOtherUsersCounters}]}) => isBasisToJustificationsHavingOtherUsersCounters)
  }

  updateWritingQuote(writingQuote) {
    return this.database.query(
      'update writing_quotes set quote_text = $1 where writing_quote_id = $2 and deleted is null returning *',
      [writingQuote.quoteText, writingQuote.id]
    )
      .then( ({rows: [writingQuoteRow]}) => {
        const updatedWritingQuote = toWritingQuote(writingQuoteRow)
        updatedWritingQuote.writing = writingQuote.writing
        updatedWritingQuote.urls = writingQuoteRow.urls
        return updatedWritingQuote
      })
  }

  deleteWritingQuoteUrls(writingQuote, urls, now) {
    const sql = `
      update writing_quote_urls set deleted = $1 
        where writing_quote_id = $2 and url_id = any ($3) 
        returning *
    `
    return this.database.query(sql, [now, writingQuote.id, map(urls, url => url.id)])
      .then( ({rows}) => map(rows, toWritingQuoteUrl) )
  }
}
