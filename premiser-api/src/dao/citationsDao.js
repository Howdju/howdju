const map = require('lodash/map')
const groupBy = require('lodash/groupBy')
const sortBy = require('lodash/sortBy')
const head = require('lodash/head')

const {
  toCitation,
} = require("../orm")
const {query, queries} = require('./../db')
const {
  JustificationBasisType,
  JustificationTargetType,
  VoteTargetType,
} = require('../models')
const {logger} = require('../logger')


class CitationsDao {
  readCitationEquivalentTo(citation) {
    return query('select * from citations where text = $1 and deleted is null', [citation.text])
        .then( ({rows}) => {
          if (rows.length > 1) {
            logger.error(`${rows.length} equivalent citations found`, citation)
          }
          return toCitation(head(rows))
        })
  }
  createCitation(citation, userId, now) {
    const sql = 'insert into citations (text, creator_user_id, created) values ($1, $2, $3) returning *'
    return query(sql, [citation.text, userId, now])
        .then( ({rows: [row]}) => toCitation(row) )
  }
  doOtherCitationsHaveSameTextAs(citation) {
    const sql = `
      select count(*) > 0 as has_conflict
      from citations where citation_id != $1 and text = $2 and deleted is null
      `
    return query(sql, [citation.id, citation.text])
        .then( ({rows: [{has_conflict}]}) => has_conflict )
  }

  hasCitationChanged(citation) {
    const sql = `
      select count(*) < 1 as has_changed
      from citations where citation_id = $1 and text = $2
      `
    return query(sql, [citation.id, citation.text])
        .then( ({rows: [{has_changed}]}) => has_changed )
  }

  isCitationOfBasisToJustificationsHavingOtherUsersVotes(userId, citation) {
    const sql = `
      with
        citation_citation_references as (
          select *
          from citation_references where citation_id = $1 and deleted is null
        )
        , basis_justifications as (
          select *
          from justifications j join citation_citation_references cr on 
                j.basis_type = $2
            and j.basis_id = cr.citation_reference_id
            and j.deleted is null
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
      citation.id,
      JustificationBasisType.CITATION_REFERENCE,
      userId,
      VoteTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_votes: isBasisToJustificationsHavingOtherUsersVotes}]}) => isBasisToJustificationsHavingOtherUsersVotes)
  }

  isCitationOfBasisToOtherUsersJustifications(userId, citation) {
    const sql = `
      with 
        citation_citation_references as (
          select *
          from citation_references where citation_id = $1 and deleted is null
        )
      select count(*) > 0 as has_other_users_justifications 
      from justifications j join citation_citation_references cr on
            j.basis_id = cr.citation_reference_id
        and j.basis_type = $2 
        and j.creator_user_id != $3
        and j.deleted is null
    `
    return query(sql, [
      citation.id,
      JustificationBasisType.CITATION_REFERENCE,
      userId,
    ]).then( ({rows: [{has_other_users_justifications: isBasisToOtherUsersJustifications}]}) => isBasisToOtherUsersJustifications)
  }

  isCitationOfBasisToJustificationsHavingOtherUsersCounters(userId, citation) {
    const sql = `
      with
        citation_citation_references as (
          select *
          from citation_references where citation_id = $1 and deleted is null
        )
        , basis_justifications as (
          select *
          from justifications j join citation_citation_references cr on
                basis_type = $2 
            and j.basis_id = cr.citation_reference_id and j.deleted is null
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
      citation.id,
      JustificationBasisType.CITATION_REFERENCE,
      userId,
      JustificationTargetType.JUSTIFICATION,
    ]).then( ({rows: [{has_other_user_counters: isBasisToJustificationsHavingOtherUsersCounters}]}) => isBasisToJustificationsHavingOtherUsersCounters)
  }

  update(citation) {
    return query('update citations set text = $1 where citation_id = $2 returning *', [citation.text, citation.id])
        .then( ({rows: [citationRow]}) => toCitation(citationRow) )
  }
}

module.exports = new CitationsDao()