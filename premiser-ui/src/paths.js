import { createPath } from 'history/PathUtils';
import queryString from 'query-string'

export const mainSearchPathName = '/'

export const createJustificationPath = '/create-justification'

class Paths {
  home = () => '/'
  login = () => '/login'
  statement = ({id, slug}) => `/s/${id}/${slug || ''}`
  citationUsages = citation => `/j?citationId=${citation.id}`
  createJustification = (basisType, basisId) => createPath({
    pathname: createJustificationPath,
    search: '?' + queryString.stringify({basisType, basisId})
  })
  mainSearch = mainSearchText => createPath({
    pathname: mainSearchPathName,
    search: '?' + window.encodeURIComponent(mainSearchText)
  })
  justification = j => this.statement({id: j.rootStatement.id}) + '#justification-' + j.id
}

export default new Paths()