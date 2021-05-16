const concat = require('lodash/concat')
const forEach = require('lodash/forEach')
const map = require('lodash/map')
const Promise = require('bluebird')
const snakeCase = require('lodash/snakeCase')

const {
  JustificationBasisType,
  JustificationTargetType,
  JustificationBasisCompoundAtomType,
  JustificationRootTargetType,
  SortDirection,
  SourceExcerptType,
} = require('howdju-common')

const {
  toWritQuote,
  toWritQuoteUrl,
  toUrl,
} = require('./orm')
const {
  mapSingle,
  normalizeText,
} = require('./daosUtil')
const {DatabaseSortDirection} = require('./daoModels')


exports.WritQuotesDao = class WritQuotesDao {

  constructor(logger, database, urlsDao, writQuoteUrlTargetsDao) {
    this.logger = logger
    this.database = database
    this.urlsDao = urlsDao
    this.writQuoteUrlTargetsDao = writQuoteUrlTargetsDao
  }

  readWritQuoteForId(writQuoteId) {
    return Promise.all([
      this.database.query(
        'readWritQuoteForId',
        `
          select 
              wq.*
            , w.title as writ_title
            , w.created as writ_created
            , w.creator_user_id as writ_creator_user_id
          from writ_quotes wq join writs w on 
                wq.writ_quote_id = $1
            and wq.writ_id = w.writ_id
            and wq.deleted is null
            and w.deleted is null
          `,
        [writQuoteId]
      ),
      this.readUrlsForWritQuoteId(writQuoteId)
    ])
      .then( ([
        {rows: [row]},
        urls,
      ]) => {
        const writQuote = toWritQuote(row)
        writQuote.urls = urls
        return writQuote
      })
  }

  readWritQuoteHavingWritIdAndQuoteText(writId, quoteText) {
    return this.database.query(
      'readWritQuoteHavingWritIdAndQuoteText',
      `select * from writ_quotes where writ_id = $1 and normal_quote_text = $2 and deleted is null`,
      [writId, normalizeText(quoteText)]
    )
      .then(mapSingle(this.logger, toWritQuote, 'writ_quotes', {writId, quoteText}))
  }

  readWritQuotes(sorts, count) {
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
      const columnName = sort.property === 'id' ? 'writ_quote_id' : snakeCase(sort.property)
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
        , w.title as writ_title
        , w.created as writ_created
        , w.creator_user_id as writ_creator_user_id
      from writ_quotes wq
          join writs w USING (writ_id)
        where 
          ${whereSql}
      ${orderBySql}
      ${countSql}
      `
    return this.database.query('readWritQuotes', sql, args)
      .then(({rows}) => map(rows, toWritQuote))
  }

  readMoreWritQuotes(sortContinuations, count) {
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
      const value = sortContinuation.value
      // The default direction is ascending
      const direction = sortContinuation.direction === SortDirection.DESCENDING ?
        DatabaseSortDirection.DESCENDING :
        DatabaseSortDirection.ASCENDING
      // 'id' is a special property name for entities. The column is prefixed by the entity type
      const columnName = sortContinuation.property === 'id' ? 'writ_quote_id' : snakeCase(sortContinuation.property)
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
        , w.title as writ_title
        , w.created as writ_created
      from writ_quotes wq
          join writs w using (writ_id)
        where 
          ${whereSql}
        and (
          ${continuationWhereSql}
        )
      ${orderBySql}
      ${countSql}
      `
    return this.database.query('readMoreWritQuotes', sql, args)
      .then( ({rows}) => map(rows, toWritQuote) )
  }

  readWritQuotesByIdForRootPropositionId(propositionId) {
    return this.readWritQuotesByIdForRootTarget(JustificationRootTargetType.PROPOSITION, propositionId)
  }

  readWritQuotesByIdForRootTarget(rootTargetType, rootTargetId) {
    const sql = `
        select 
            wq.writ_quote_id
          , wq.quote_text
          , wq.created
          , wq.creator_user_id
          , w.writ_id
          , w.title as writ_title
          , w.created as writ_created
          , w.creator_user_id as writ_creator_user_id
        from justifications j 
            join writ_quotes wq on 
                  j.basis_type = $2
              and j.basis_id = wq.writ_quote_id
            join writs w using (writ_id)
          where
                j.root_target_type = $6
            and j.root_target_id = $1
            and j.deleted is null
            and wq.deleted is null
            and w.deleted is null
      
      union
      
        select 
            wq.writ_quote_id
          , wq.quote_text
          , wq.created
          , wq.creator_user_id
          , w.writ_id
          , w.title as writ_title
          , w.created as writ_created
          , w.creator_user_id as writ_creator_user_id
        from justifications j 
            join justification_basis_compounds jbc on
                  j.basis_type = $3
              and j.basis_id = jbc.justification_basis_compound_id
            join justification_basis_compound_atoms jbca using (justification_basis_compound_id)
            join source_excerpt_paraphrases sep on
                  jbca.entity_type = $4
              and jbca.entity_id = sep.source_excerpt_paraphrase_id
            join writ_quotes wq on
                  sep.source_excerpt_type = $5
              and sep.source_excerpt_id = wq.writ_quote_id
            join writs w using (writ_id)
          where 
                j.root_target_type = $6
            and j.root_target_id = $1
            and j.deleted is null
            and jbc.deleted is null
            and sep.deleted is null
            and wq.deleted is null
            and w.deleted is null
      `
    const args = [
      rootTargetId,
      JustificationBasisType.WRIT_QUOTE,
      JustificationBasisType.JUSTIFICATION_BASIS_COMPOUND,
      JustificationBasisCompoundAtomType.SOURCE_EXCERPT_PARAPHRASE,
      SourceExcerptType.WRIT_QUOTE,
      rootTargetType,
    ]
    return Promise.all([
      this.database.query('readWritQuotesByIdForRootTarget', sql, args),
      this.urlsDao.readUrlsByWritQuoteIdForRootTarget(rootTargetType, rootTargetId),
      this.writQuoteUrlTargetsDao.readUrlsByWritQuoteIdForRootTarget(rootTargetType, rootTargetId),
    ])
      .then( ([
        {rows},
        urlsByWritQuoteId,
        urlTargetsByUrlIdByWritQuoteId,
      ]) => {
        const writQuotesById = {}
        forEach(rows, row => {
          const writQuote = toWritQuote(row)
          const writQuoteId = row.writ_quote_id
          writQuote.urls = urlsByWritQuoteId[writQuoteId] || []
          const urlTargetsByUrlId = urlTargetsByUrlIdByWritQuoteId.get(writQuoteId)
          if (urlTargetsByUrlId) {
            for (const url of writQuote.urls) {
              const target = urlTargetsByUrlId.get(url.id)
              if (target) {
                url.target = target
              }
            }
          }
          writQuotesById[writQuoteId] = writQuote
        })
        return writQuotesById
      })
  }

  readWritQuoteUrlsForWritQuote(writQuote) {
    return this.database.query(
      'readWritQuoteUrlsForWritQuote',
      'select * from writ_quote_urls where writ_quote_id = $1 and deleted is null',
      [writQuote.id])
      .then( ({rows}) => map(rows, toWritQuoteUrl) )
  }

  readWritQuotesHavingUrlContainingText(text) {
    const sql = `
      with 
        containing_urls as (
          select url_id from urls where url ilike '%'|| $1 || '%'
        )
      select distinct wq.writ_quote_id
      from 
        writ_quotes wq 
          join writs w using (writ_id)
          join writ_quote_urls wqu using (writ_quote_id)
          join containing_urls u using (url_id)
        where 
              wq.deleted is null
          and w.deleted is null
          and wqu.deleted is null
    `
    return this.database.query('readWritQuotesHavingUrlContainingText', sql, [text])
      .then(({rows}) => Promise.all(map(rows, row => this.readWritQuoteForId(row.writ_quote_id))))
  }

  createWritQuoteUrls(writQuote, urls, userId, now) {
    return Promise.all(map(urls, url => this.createWritQuoteUrl(writQuote, url, userId, now)))
  }

  createWritQuoteUrl(writQuote, url, userId, now) {
    return this.database.query(
      'createWritQuoteUrl',
      `
        insert into writ_quote_urls (writ_quote_id, url_id, creator_user_id, created) 
        values ($1, $2, $3, $4)
        returning *
      `,
      [writQuote.id, url.id, userId, now]
    )
      .then( ({rows}) => map(rows, toWritQuoteUrl))
  }

  createWritQuoteUrlTarget(writQuote, url, userId, now) {
    return this.database.query(
      'createWritQuoteUrlTarget.target',
      `insert into writ_quote_url_targets (writ_quote_id, url_id) values ($1, $2) returning writ_quote_url_target_id`,
      [writQuote.id, url.id]
    )
      .then(({rows: [row]}) => Promise.all(map(url.target.anchors, (anchor) => this.database.query(
        'createWritQuoteUrlTarget.anchors',
        `
          insert into writ_quote_url_target_anchors (writ_quote_url_target_id, exact_text, prefix_text, suffix_text)
          values ($1, $2, $3, $4)
        `,
        [row.writ_quote_url_target_id, anchor.exact, anchor.prefix, anchor.suffix]
      ))))
  }

  createWritQuote(writQuote, userId, now) {
    const sql = `
      insert into writ_quotes (quote_text, normal_quote_text, writ_id, creator_user_id, created) 
      values ($1, $2, $3, $4, $5) 
      returning *
    `
    // Don't insert an empty quote
    const quoteText = writQuote.quoteText || null
    return this.database.query(
      'createWritQuote',
      sql,
      [quoteText, normalizeText(quoteText), writQuote.writ.id, userId, now]
    )
      .then( ({rows: [row]}) => toWritQuote(row))
  }

  hasEquivalentWritQuotes(writQuote) {
    const sql = `
      select count(*) > 0 has_conflict 
      from writ_quotes wq join writs w using (writ_id)
        where 
              wq.writ_quote_id != $1 
          and (wq.writ_id = $3 or w.title = $4)
          and wq.quote_text = $2
          and wq.deleted is null
          and w.deleted is null
      `
    const args = [writQuote.id, writQuote.quoteText, writQuote.writ.id, writQuote.writ.title]
    return this.database.query('hasEquivalentWritQuotes', sql, args)
      .then( ({rows: [{has_conflict}]}) => has_conflict)
  }

  hasWritQuoteChanged(writQuote) {
    const sql = `
      select count(*) < 1 as has_changed 
      from writ_quotes 
        where writ_quote_id = $1 and quote_text = $2
      `
    return this.database.query('hasWritQuoteChanged', sql, [writQuote.id, writQuote.quoteText])
      .then( ({rows: [{has_changed}]}) => has_changed )
  }

  readUrlsForWritQuoteId(writQuoteId) {
    return this.database.query(
      'readUrlsForWritQuoteId',
      `
      select u.* 
      from urls u join writ_quote_urls wqu using (url_id) 
        where 
                wqu.writ_quote_id = $1
            and u.deleted is null
            and wqu.deleted is null
      `, [writQuoteId])
      .then( ({rows}) => map(rows, toUrl))
  }

  isBasisToJustificationsHavingOtherUsersVotes(userId, writQuote) {
    const sql = `
      with
        basis_justifications as (
          select *
          from justifications
            where basis_type = $1 and basis_id = $2 and deleted is null
        )
        , basis_justification_votes as (
          select * from justification_votes v
            join basis_justifications j on
                  v.user_id != $3
              and v.justification_id = j.justification_id
              and v.deleted is null
        )
      select count(*) > 0 as has_votes from basis_justification_votes
    `
    return this.database.query('isBasisToJustificationsHavingOtherUsersVotes', sql, [
      JustificationBasisType.WRIT_QUOTE,
      writQuote.id,
      userId,
    ]).then( ({rows: [{has_votes: isBasisToJustificationsHavingOtherUsersVotes}]}) => isBasisToJustificationsHavingOtherUsersVotes)
  }

  isBasisToOtherUsersJustifications(userId, writQuote) {
    const sql = `
      select count(*) > 0 as has_other_users_justifications 
      from justifications where 
            basis_type = $1 
        and basis_id = $2 
        and creator_user_id != $3
        and deleted is null
        `
    return this.database.query('isBasisToOtherUsersJustifications', sql, [
      JustificationBasisType.WRIT_QUOTE,
      writQuote.id,
      userId,
    ]).then( ({rows: [{has_other_users_justifications: isBasisToOtherUsersJustifications}]}) => isBasisToOtherUsersJustifications)
  }

  isBasisToJustificationsHavingOtherUsersCounters(userId, writQuote) {
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
    return this.database.query('isBasisToJustificationsHavingOtherUsersCounters', sql, [
      JustificationBasisType.WRIT_QUOTE,
      writQuote.id,
      userId,
      JustificationTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_other_user_counters: isBasisToJustificationsHavingOtherUsersCounters}]}) => isBasisToJustificationsHavingOtherUsersCounters)
  }

  updateWritQuote(writQuote) {
    return this.database.query(
      'updateWritQuote',
      'update writ_quotes set quote_text = $1, normal_quote_text = $2 where writ_quote_id = $3 and deleted is null returning *',
      [writQuote.quoteText, normalizeText(writQuote.quoteText), writQuote.id]
    )
      .then( ({rows: [writQuoteRow]}) => {
        const updatedWritQuote = toWritQuote(writQuoteRow)
        updatedWritQuote.writ = writQuote.writ
        updatedWritQuote.urls = writQuoteRow.urls
        return updatedWritQuote
      })
  }

  deleteWritQuoteUrls(writQuote, urls, now) {
    const sql = `
      update writ_quote_urls set deleted = $1 
        where writ_quote_id = $2 and url_id = any ($3) 
        returning *
    `
    return this.database.query('deleteWritQuoteUrls', sql, [now, writQuote.id, map(urls, url => url.id)])
      .then( ({rows}) => map(rows, toWritQuoteUrl) )
  }
}
