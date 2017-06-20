const map = require('lodash/map')
const sortBy = require('lodash/sortBy')
const head = require('lodash/head')

const urlsDao = require('./urlsDao')
const {
  toCitationReference,
  toCitation,
  toCitationReferenceUrl,
  toUrl,
} = require("../orm")
const {query} = require('./../db')
const {
  JustificationBasisType,
  JustificationTargetType,
  VoteTargetType,
} = require('../models')
const {logger} = require('../logger')


class CitationReferencesDao {

  constructor(urlsDao) {
    this.urlsDao = urlsDao
  }

  read(citationReferenceId) {
    return Promise.all([
      query('select * from citation_references where citation_reference_id = $1 and deleted is null', [citationReferenceId]),
      query(`
        select * 
        from citations c 
          join citation_references cr using (citation_id) 
            where 
                  cr.citation_reference_id = $1 
              and cr.deleted is null 
              and c.deleted is null`,
      [citationReferenceId]
      ),
      this.readUrlsByCitationReferenceId(citationReferenceId)
    ])
        .then( ([
                  {rows: [citationReferenceRow]},
                  {rows: [citationRow]},
                  urls,
                ]) => {
          const citationReference = toCitationReference(citationReferenceRow)
          citationReference.citation = toCitation(citationRow)
          citationReference.urls = urls
          return citationReference
        })
  }

  readCitationReferencesEquivalentTo(citationReference) {

    return query(
        'select * from citation_references where citation_id = $1 and quote = $2 and deleted is null',
        [citationReference.citation.id, citationReference.quote]
    )
        .then( ({rows}) => {
          if (rows.length > 1) {
            logger.error(`${rows.length} equivalent citation references`, citationReference)
          }
          return toCitationReference(head(rows))
        })
  }

  readCitationReferenceUrl(citationReference, url) {
    return query('select * from citation_reference_urls where citation_reference_id = $1 and url_id = $2 and deleted is null',
        [citationReference.id, url.id])
        .then( ({rows}) => map(rows, toCitationReferenceUrl))
  }

  createCitationReferenceUrls(citationReference, urls, userId, now) {
    return Promise.all(map(urls, url => this.createCitationReferenceUrl(citationReference, url, userId, now)))
  }

  createCitationReferenceUrl(citationReference, url, userId, now) {
    return query(`
      insert into citation_reference_urls (citation_reference_id, url_id, creator_user_id, created) 
      values ($1, $2, $3, $4)
      returning *
      `,
      [citationReference.id, url.id, userId, now]
    )
        .then( ({rows}) => map(rows, toCitationReferenceUrl))
  }

  createCitationReference(citationReference, userId, now) {
    const sql = `
      insert into citation_references (quote, citation_id, creator_user_id, created) 
      values ($1, $2, $3, $4) 
      returning *
    `
    // Don't insert an empty quote
    const quote = citationReference.quote || null
    return query(sql, [quote, citationReference.citation.id, userId, now])
        .then( ({rows: [row]}) => toCitationReference(row))
  }

  hasEquivalentCitationReferences(citationReference) {
    const sql = `
      select count(*) > 0 has_conflict 
      from citation_references cr join citations c using (citation_id)
        where 
              cr.citation_reference_id != $1 
          and (cr.citation_id = $3 or c.text = $4)
          and cr.quote = $2
          and cr.deleted is null
          and c.deleted is null
      `
    const args = [citationReference.id, citationReference.quote, citationReference.citation.id, citationReference.citation.text]
    return query(sql, args)
        .then( ({rows: [{has_conflict}]}) => has_conflict)
  }

  hasCitationReferenceChanged(citationReference) {
    const sql = `
      select count(*) < 1 as has_changed
      from citation_references 
        where citation_reference_id = $1 and quote = $2
      `
    return query(sql, [citationReference.id, citationReference.quote])
        .then( ({rows: [{has_changed}]}) => has_changed )
  }

  readUrlsByCitationReferenceId(citationReferenceId) {
    return query(`
      select u.* 
      from urls u join citation_reference_urls cru using (url_id) 
        where 
                citation_reference_id = $1
            and u.deleted is null
            and cru.deleted is null
      `, [citationReferenceId])
        .then( ({rows}) => map(rows, toUrl))
  }

  isBasisToJustificationsHavingOtherUsersVotes(userId, citationReference) {
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
    return query(sql, [
      JustificationBasisType.CITATION_REFERENCE,
      citationReference.id,
      userId,
      VoteTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_votes: isBasisToJustificationsHavingOtherUsersVotes}]}) => isBasisToJustificationsHavingOtherUsersVotes)
  }

  isBasisToOtherUsersJustifications(userId, citationReference) {
    const sql = `
      select count(*) > 0 as has_other_users_justifications 
      from justifications where 
            basis_type = $1 
        and basis_id = $2 
        and creator_user_id != $3
        and deleted is null
        `
    return query(sql, [
      JustificationBasisType.CITATION_REFERENCE,
      citationReference.id,
      userId,
    ]).then( ({rows: [{has_other_users_justifications: isBasisToOtherUsersJustifications}]}) => isBasisToOtherUsersJustifications)
  }

  isBasisToJustificationsHavingOtherUsersCounters(userId, citationReference) {
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
    return query(sql, [
      JustificationBasisType.CITATION_REFERENCE,
      citationReference.id,
      userId,
      JustificationTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_other_user_counters: isBasisToJustificationsHavingOtherUsersCounters}]}) => isBasisToJustificationsHavingOtherUsersCounters)
  }

  updateCitationReference(citationReference) {
    return query(
        'update citation_references set quote = $1 where citation_reference_id = $2 and deleted is null returning *',
        [citationReference.quote, citationReference.id]
    )
        .then( ({rows: [citationReferenceRow]}) => {
          const updatedCitationReference = toCitationReference(citationReferenceRow)
          updatedCitationReference.citation = citationReference.citation
          updatedCitationReference.urls = citationReferenceRow.urls
          return updatedCitationReference
        })
  }

  deleteCitationReferenceUrls(citationReference, urls, now) {
    const sql = `
      update citation_reference_urls set deleted = $1 
        where citation_reference_id = $2 and url_id = any ($3) 
        returning *
    `
    return query(sql, [now, citationReference.id, map(urls, url => url.id)])
        .then( ({rows}) => map(rows, toCitationReferenceUrl) )
  }
}

module.exports = new CitationReferencesDao(urlsDao)