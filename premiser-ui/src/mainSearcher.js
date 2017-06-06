import paths from './paths'
import { createPath } from 'history/PathUtils';
import head from 'lodash/head'

class MainSearcher {
  mainSearchText = location => {
    if (
        // Return first query param that doesn't have a value, and that isn't any specially supported query param
      // (what if someone actually tries to search using a specially supported query param!? Maybe give a special value =_search_?)
      // TODO handle when there are additional query params
      // TODO ignore whitelisted parameters, and then find some way to select from the remaining parameters
      location &&
      location.search
    ) {
      const queryParams = window.decodeURIComponent(location.search.substring(1))
      const headParam = head(queryParams.split('&'))
      if (headParam && !headParam.includes('=')) {
        return headParam
      }
    }

    return null
  }
  isSearch = location => {
    const searchText = this.mainSearchText(location)
    const searchPath = paths.mainSearch(searchText)
    const actualPath = createPath(location)
    return searchText && searchPath === actualPath
  }
}

export default new MainSearcher()