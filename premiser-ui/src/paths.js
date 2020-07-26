import { createPath } from 'history'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import join from 'lodash/join'
import queryString from 'query-string'

import {
  JustificationRootTargetType,
  newExhaustedEnumError,
  toSlug,
} from 'howdju-common'

import {logger} from './logger'
import {contextTrailShortcutByType} from './viewModels'


export const mainSearchPathName = '/'

export const createJustificationPath = '/create-justification'

// I was going to extend CommonPaths, but doing that results in `TypeError: Class constructor CommonPaths cannot be invoked without 'new'`
// when running jest.  
class Paths {
  home = () => '/'

  featuredPerspectives = () => '/featured-perspectives'
  recentActivity = () => '/recent-activity'
  whatsNext = () => '/whats-next'
  about = () => '/about'

  login = () => '/login'
  requestRegistration = () => '/request-registration'
  requestPasswordReset = () => '/request-password-reset'

  proposition = (proposition, contextTrailItems, noSlug=false) => {
    const {id, slug} = proposition
    if (!id) {
      return '#'
    }
    const slugPath = !noSlug && slug ?
      '/' + slug :
      ''
    const query = !isEmpty(contextTrailItems) ?
      '?context-trail=' + join(map(contextTrailItems, i => `${contextTrailShortcutByType[i.targetType]},${i.target.id}`), ';') :
      ''
    return `/p/${id}${slugPath}${query}`
  }
  statement = (statement) => {
    return `/s/${statement.id}`
  }
  justification = j => {
    switch (j.rootTargetType) {
      case JustificationRootTargetType.PROPOSITION:
        return this.proposition(j.rootTarget) + '#justification-' + j.id
      case JustificationRootTargetType.STATEMENT:
        return this.statement(j.rootTarget) + '#justification-' + j.id
      default:
        throw newExhaustedEnumError('JustificationRootTargetType', j.rootTargetType)
    }
  }

  persorg = (persorg) => `/persorgs/${persorg.id}/${toSlug(persorg.name)}`

  writUsages = writ => this.searchJustifications({writId: writ.id})
  writQuoteUsages = (writQuote) => {
    if (!writQuote.id) {
      return '#'
    }
    return this.searchJustifications({writQuoteId: writQuote.id})
  }

  createJustification = (basisSourceType, basisSourceId) => {
    const location = {
      pathname: createJustificationPath,
    }
    if (basisSourceType || basisSourceId) {
      if (!(basisSourceType && basisSourceId)) {
        logger.warn(`If either of basisSourceType/basisSourceId are present, both must be: basisSourceType: ${basisSourceType} basisSourceId: ${basisSourceId}.`)
      }
      location['search'] = '?' + queryString.stringify({basisSourceType, basisSourceId})
    }
    return createPath(location)
  }
  searchJustifications = params => createPath({
    pathname: '/search-justifications',
    search: '?' + queryString.stringify(params)
  })
  mainSearch = mainSearchText => createPath({
    pathname: mainSearchPathName,
    search: '?' + window.encodeURIComponent(mainSearchText)
  })
  propositionUsages = (propositionId) => `/proposition-usages?propositionId=${propositionId}`
  statementUsages = (statementId) => `/statement-usages?propositionId=${statementId}`

  tools = () => '/tools'

  privacyPolicy = () => "/terms/privacy-policy"
  terms = () => "/terms/terms-of-use"

  tag = (tag) => `/tags/${tag.id}/${toSlug(tag.name)}`
}

export default new Paths()
