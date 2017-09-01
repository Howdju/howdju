import { createPath } from 'history/PathUtils'
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

  statement = ({id, slug}) => `/s/${id}/${slug || ''}`
  justification = j => this.statement(j.rootStatement) + '#justification-' + j.id
  citationUsages = citation => this.searchJustifications({citationId: citation.id})
  citationReferenceUsages = citationReference => this.searchJustifications({citationReferenceId: citationReference.id})

  createJustification = (basisType, basisId) => createPath({
    pathname: createJustificationPath,
    search: '?' + queryString.stringify({basisType, basisId})
  })
  searchJustifications = params => createPath({
    pathname: '/search-justifications',
    search: '?' + queryString.stringify(params)
  })
  mainSearch = mainSearchText => createPath({
    pathname: mainSearchPathName,
    search: '?' + window.encodeURIComponent(mainSearchText)
  })
}

export default new Paths()