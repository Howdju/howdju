import { combineReducers } from '@reduxjs/toolkit'
import { connectRouter } from 'connected-react-router'
import { History } from 'history'
import mapValues from 'lodash/mapValues'

import app from "./app"
import auth from './auth'
import autocompletes from "./autocompletes"
import editors from "./editors"
import entities from "./entities"
import errors from './errors'
import privacyConsent from "./privacyConsent"
import ui from "./ui"
import widgets from './widgets'
import * as sagaSlices from '../sagaSlices'

export default (history: History) => combineReducers({
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
  ...mapValues(sagaSlices, s => s.reducer)
})
