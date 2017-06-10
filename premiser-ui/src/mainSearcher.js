import paths from './paths'
import { createPath } from 'history/PathUtils';
import head from 'lodash/head'

class MainSearcher {
  mainSearchText = location => {
    if (
      // Return first query param if it doesn't have a value
      // Supports short-hand search like: howdju.com?politics
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