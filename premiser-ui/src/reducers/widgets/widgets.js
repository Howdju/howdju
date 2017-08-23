import { combineReducers } from 'redux'

import listEntities from './listEntities'
import expandCollapse from './expandCollapse'

export default combineReducers({
  listEntities,
  expandCollapse,
})
