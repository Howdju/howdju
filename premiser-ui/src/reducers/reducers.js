import { combineReducers } from 'redux'
import { routerReducer } from 'react-router-redux'

import app from "./app"
import auth from './auth'
import autocompletes from "./autocompletes"
import editors from "./editors"
import entities from "./entities"
import errors from './errors'
import ui from "./ui"
import widgets from './widgets'

export default combineReducers({
  app,
  auth,
  autocompletes,
  editors,
  entities,
  errors,
  router: routerReducer,
  ui,
  widgets,
})
