import { createPath } from 'history/PathUtils'
import map from 'lodash/map'
import isEmpty from 'lodash/isEmpty'
import join from 'lodash/join'
import queryString from 'query-string'

export const mainSearchPathName = '/'

export const createJustificationPath = '/create-justification'

class Paths {
  home = () => '/'

  featuredPerspectives = () => '/featured-perspectives'
  recentActivity = () => '/recent-activity'
  whatsNext = () => '/whats-next'
  about = () => '/about'

  login = () => '/login'

  statement = (statement, trailStatements) => {
    const {id, slug} = statement
    const qs = !isEmpty(trailStatements) ?
      '?statement-trail=' + join(map(trailStatements, s => s.id), ',') :
      ''
    return `/s/${id}/${slug || ''}` + qs
  }
  justification = j => this.statement(j.rootStatement) + '#justification-' + j.id
  writUsages = writ => this.searchJustifications({writId: writ.id})
  writQuoteUsages = writQuote => this.searchJustifications({writQuoteId: writQuote.id})

  createJustification = (basisSourceType, basisSourceId) => createPath({
    pathname: createJustificationPath,
    search: '?' + queryString.stringify({basisSourceType, basisSourceId})
  })
  searchJustifications = params => createPath({
    pathname: '/search-justifications',
    search: '?' + queryString.stringify(params)
  })
  mainSearch = mainSearchText => createPath({
    pathname: mainSearchPathName,
    search: '?' + window.encodeURIComponent(mainSearchText)
  })

  tools = () => '/tools'

  privacy = () => "/privacy"
}

export default new Paths()