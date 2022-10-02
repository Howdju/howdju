import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

import app from "./app"
import auth from './auth'
import autocompletes from "./autocompletes"
import editors from "./editors"
import entities from "./entities"
import errors from './errors'
import privacyConsent from "./privacyConsent"
import ui from "./ui"
import widgets from './widgets'
import { History } from 'history'

export default (history: History<unknown>) => combineReducers({
  app,
  auth,
  autocompletes,
  editors,
  entities,
  errors,
  privacyConsent,
  router: connectRouter(history),
  ui,
  widgets,
})
