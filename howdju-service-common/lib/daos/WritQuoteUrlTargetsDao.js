const {
  JustificationBasisType,
  JustificationRootTargetType,
} = require('howdju-common')

const {addArrayParams} = require('./daosUtil')

exports.WritQuoteUrlTargetsDao = class WritQuoteUrlTargetsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  async readByUrlIdByWritQuoteIdForRootPropositionId(rootPropositionId) {
    const {rows} = await this.database.query(
      'readUrlTargetsForRootPropositionId',
      `
        with
          statement_proposition_ids as (
              select statement_id from statements where root_proposition_id = $1
          )
        select
          wq.writ_quote_id
          , wqut.*
          , wquta.*
          , u.*
        from
          justifications j
          inner join writ_quotes wq on j.basis_type = $4 and j.basis_id = wq.writ_quote_id
          inner join writ_quote_url_targets wqut using (writ_quote_id)
          inner join writ_quote_url_target_anchors wquta using (writ_quote_url_target_id)
          inner join urls u using (url_id)
        where
          j.root_target_type = $2 and j.root_target_id = $1
          or j.root_target_type = $3 and j.root_target_id in (select * from statement_proposition_ids)
      `,
      [
        rootPropositionId,
        JustificationRootTargetType.PROPOSITION,
        JustificationRootTargetType.STATEMENT,
        JustificationBasisType.WRIT_QUOTE,
      ]
    )
    return toWritQuoteUrlTargetsByUrlIdByWritQuoteId(rows)
  }

  async readByUrlIdByWritQuoteIdForJustificationIds(justificationIds) {
    const baseArgs = [JustificationBasisType.WRIT_QUOTE]
    const {params: justificationIdParams, args} = addArrayParams(baseArgs, justificationIds)
    const {rows} = await this.database.query(
      'readWritQuoteUrlTargetsForJustificationIds',
      `
        select
          wq.writ_quote_id
          , wqut.*
          , wquta.*
          , u.*
        from
          justifications j
          inner join writ_quotes wq on j.basis_type = $1 and j.basis_id = wq.writ_quote_id
          inner join writ_quote_url_targets wqut using (writ_quote_id)
          inner join writ_quote_url_target_anchors wquta using (writ_quote_url_target_id)
          inner join urls u using (url_id)
        where
          j.justification_id in (${justificationIdParams.join(',')})
      `,
      args
    )
    return toWritQuoteUrlTargetsByUrlIdByWritQuoteId(rows)
  }
}

function toWritQuoteUrlTargetsByUrlIdByWritQuoteId(rows) {
  const urlTargetById = new Map()
  for (const row of rows) {
    let urlTarget = urlTargetById.get(row.writ_quote_url_target_id)
    if (!urlTarget) {
      urlTarget = {
        writQuoteId: row.writ_quote_id,
        id: row.writ_quote_url_target_id,
        url: {
          id: row.url_id,
        },
        anchors: []
      }
      urlTargetById.set(String(row.writ_quote_url_target_id), urlTarget)
    }
    urlTarget.anchors.push(extractWritQuoteUrlTargetAnchor(row))
  }

  return byUrlIdByWritQuoteId(urlTargetById.values())
}

function extractWritQuoteUrlTargetAnchor(row) {
  return {
    id: row.writ_quote_url_target_anchor_id,
    exactText: row.exact_text,
    prefixText: row.prefix_text,
    suffixText: row.suffix_text,
  }
}

function byUrlIdByWritQuoteId(urlTargets) {
  const byWritQuoteId = new Map()
  for (const urlTarget of urlTargets) {
    let byUrlId = byWritQuoteId.get(urlTarget.writQuoteId)
    if (!byUrlId) {
      byUrlId = new Map()
      byWritQuoteId.set(String(urlTarget.writQuoteId), byUrlId)
    }
    byUrlId.set(String(urlTarget.url.id), urlTarget)
  }
  return byWritQuoteId
}
