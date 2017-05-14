import { createPath } from 'history/PathUtils';

const mainSearchPathName = '/'

class Paths {
  home = () => '/'
  login = () => '/login'
  statement = ({id, slug}) => `/s/${id}/${slug || ''}`
  mainSearch = mainSearchText => createPath({
    pathname: mainSearchPathName,
    search: '?' + window.encodeURIComponent(mainSearchText)
  })
}

export default new Paths()