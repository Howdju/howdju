import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

import app from "./app"
import auth from './auth'
import autocompletes from "./autocompletes"
import editors from "./editors"
import entities from "./entities"
import errors from './errors'
import ui from "./ui"
import widgets from './widgets'

export default (history) => combineReducers({
  app,
  auth,
  autocompletes,
  editors,
  entities,
  errors,
  router: connectRouter(history),
  ui,
  widgets,
})
