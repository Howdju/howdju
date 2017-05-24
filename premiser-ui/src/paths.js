import { createPath } from 'history/PathUtils';

const mainSearchPathName = '/'

class Paths {
  home = () => '/'
  login = () => '/login'
  statement = ({id, slug}) => `/s/${id}/${slug || ''}`
  editStatement = id => `/edit-statement/${id}`
  mainSearch = mainSearchText => createPath({
    pathname: mainSearchPathName,
    search: '?' + window.encodeURIComponent(mainSearchText)
  })
}

export default new Paths()