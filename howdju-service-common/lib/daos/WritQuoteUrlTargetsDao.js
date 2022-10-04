const {
  JustificationBasisType,
  JustificationRootTargetType,
} = require('howdju-common')

const {addArrayParams} = require('./daosUtil')
const {toIdString} = require("./orm")

exports.WritQuoteUrlTargetsDao = class WritQuoteUrlTargetsDao {

  constructor(logger, database) {
    this.logger = logger
    this.database = database
  }

  async readWritQuoteUrlsByWritQuoteIdForRootTarget(rootTargetType, rootTargetId) {
    const {rows} = await this.database.query(
      'readWritQuoteUrlsByWritQuoteIdForRootTarget',
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
        rootTargetId,
        rootTargetType,
        JustificationRootTargetType.STATEMENT,
        JustificationBasisType.WRIT_QUOTE,
      ]
    )
    return toWritQuoteUrlTargetsByUrlIdByWritQuoteId(rows)
  }

  async readByUrlIdByWritQuoteIdForJustificationIds(justificationIds) {
    const baseArgs = [JustificationBasisType.WRIT_QUOTE]
    const {params: justificationIdParams, args} = addArrayParams(baseArgs, justificationIds)
    // TODO(89): replace string interpolation with query arguments
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
  // Read all the rows to get the UrlTargets with their anchors
  const urlTargetById = new Map()
  for (const row of rows) {
    let urlTarget = urlTargetById.get(toIdString(row.writ_quote_url_target_id))
    if (!urlTarget) {
      urlTarget = {
        writQuoteId: toIdString(row.writ_quote_id),
        id: toIdString(row.writ_quote_url_target_id),
        url: {
          id: toIdString(row.url_id),
        },
        anchors: []
      }
      urlTargetById.set(toIdString(row.writ_quote_url_target_id), urlTarget)
    }
    urlTarget.anchors.push(extractWritQuoteUrlTargetAnchor(row))
  }
  // Then index them by WritQuote ID and Url ID
  return byUrlIdByWritQuoteId(urlTargetById.values())
}

function extractWritQuoteUrlTargetAnchor(row) {
  return {
    id: toIdString(row.writ_quote_url_target_anchor_id),
    exactText: row.exact_text,
    prefixText: row.prefix_text,
    suffixText: row.suffix_text,
    startOffset: row.start_offset,
    endOffset: row.end_offset,
  }
}

function byUrlIdByWritQuoteId(urlTargets) {
  const byWritQuoteId = new Map()
  for (const urlTarget of urlTargets) {
    let byUrlId = byWritQuoteId.get(urlTarget.writQuoteId)
    if (!byUrlId) {
      byUrlId = new Map()
      byWritQuoteId.set(urlTarget.writQuoteId, byUrlId)
    }
    byUrlId.set(urlTarget.url.id, urlTarget)
  }
  return byWritQuoteId
}
